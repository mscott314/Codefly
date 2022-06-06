import random
from random import randint, choice
import json
import re
from time import sleep

import requests
from flask import request
from ibm_watson import AssistantV2, AssistantV1, ApiException
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
import keys

assistant = AssistantV2(
    version='2021-06-14',
    authenticator=IAMAuthenticator(keys.IAMValue)  # api key
)
assistant.set_service_url(keys.assistant_service_url)


def random_number(numbers):
    try:
        nums = re.match(r"!random\s+\d+\s+\d+\s*", numbers).group().split()
        return str(randint(int(nums[1]), int(nums[2])))
    except (AttributeError, ValueError, Exception):
        return None


def reply(user):  # main reply function

    if "!8ball".lower() in user:
        return eight_ball()
    if "!wod" in user:
        return word_of_the_day()
    if "!random" in user:
        return random_number(user)

    # noinspection PyTypeChecker
    response = assistant.message_stateless(
        assistant_id=keys.assistant_id,
        input={
            'message_type': 'text',
            'text': user
        }
    ).get_result()

    try:
        intent = response['output']['intents'][0]['intent']
    except (IndexError, KeyError, Exception) as e:
        intent = None

    try:  # it may not recognize the entity, in which case it may need to be added via api
        entity = response['output']['entities'][0]['value']
    except (IndexError, KeyError, Exception) as e:
        entity = None

    try:  # suggested word? https://api.datamuse.com/sug?s=philosophy
        spelling = f'Did you mean: {response["output"]["spelling"]["text"]} ?'
    except (IndexError, KeyError, Exception) as e:
        spelling = None

    try:
        bot_reply = response["output"]["generic"][0]["text"]
    except (IndexError, KeyError, Exception) as e:
        return None

    if intent == "Definition":
        return definitions(entity) or bot_reply

    if intent == "Quotes":
        return quotes() or bot_reply

    if intent == "Fortunes":
        return fortunes() or bot_reply

    if intent == "Jokes":
        return jokes() or bot_reply

    if intent == "Smalltalk":
        return "<span style='font-size: 0.7rem'>Is this small talk?</span>"

    return bot_reply


def definitions(entity):
    # requests.exceptions.RequestException
    def wiki():  # response["type"] == "disambiguation":
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{entity}"
        header = {'User-Agent': keys.email}
        try:
            req = requests.get(url, headers=header, timeout=5).json()
            response = req['extract']
        except (KeyError, IndexError, Exception):
            return None
        return response

    def dict_api():
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{entity}"
        try:
            response = requests.get(url, timeout=5).json()
            thing = []
            for words in response[0]['meanings'][0]['definitions']:
                thing.append(words['definition'] + '<br>')
            strung = "".join(str(s) for s in thing)
        except (KeyError, IndexError, Exception):
            return None
        return strung

    def dict_file():
        with open('static/dictionary.json', 'r') as dictionary:
            data = json.load(dictionary)
            try:
                word = data[entity]  # may be a keyError if word isn't in this file 'America' (if, then go to wordnik?)
            except (KeyError, IndexError, Exception):
                return None
        return word

    return wiki() or dict_api() or dict_file()
    # return random.choice([wiki(), dict_api(), dict_file()])


def quotes():
    with open("static/quotes.json", 'r') as dictionary:
        data = json.load(dictionary)
    try:
        word = data[randint(0, len(data))]["quote"]
    except (KeyError, IndexError, Exception):
        return None
    return word


def jokes():
    with open('/static/jokes.json', 'r') as dictionary:
        data = json.load(dictionary)
    try:
        num = randint(0, len(data))
        word = f"{data[num]['setup']} <br> {data[num]['punchline']}"
    except (KeyError, IndexError, Exception):
        return None
    return word


def fortunes():
    with open('/static/fortunes.json', 'r') as dictionary:
        data = json.load(dictionary)
    try:
        word = data[str(randint(0, len(data)))]
    except (KeyError, IndexError, Exception):
        return None
    return word


def word_of_the_day():
    try:
        data = requests.get(f'https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key={keys.wordnik}', timeout=5).json()
        result = f"<strong><a href='https://www.wordnik.com/words/{data['word']}' target='_blank'>{data['word']}</a>: \
        </strong>{data['definitions'][0]['text']}"
    except (KeyError, IndexError, Exception):
        return "Please try again later. (!wod)"
    return result


def eight_ball():
    response = {
        0: "It is certain.",
        1: "It is decidedly so.",
        2: "Without a doubt.",
        3: "Yes definitely!",
        4: "You may rely on it.",
        5: "As I see it, yes.",
        6: "Most likely.",
        7: "Outlook good.",
        8: "Yes!",
        9: "Signs point to yes!",
        10: "Reply hazy, try again.",
        11: "Ask again later.",
        12: "Better not tell you now.",
        13: "Cannot predict now.",
        14: "Concentrate and ask again!",
        15: "Don't count on it!",
        16: "My reply is no.",
        17: "My sources say no.",
        18: "Outlook not so good.",
        19: "Very doubtful."
    }
    return response[randint(0, 19)]
