import keys
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, EmailField, SubmitField
from wtforms.validators import DataRequired
# import pymongo
# from pymongo import MongoClient
import smtplib
from email.message import EmailMessage


app = Flask(__name__)
app.config['SECRET_KEY'] = keys.app_config_secret_key


@app.route('/')
def index():
    return render_template('index.html', title="Codefly"), 200


@app.route('/articles/')
def articles():
    return render_template('articles.html', title="Codefly - Articles"), 200


@app.route('/about/')
def about():
    return render_template('about.html', title="Codefly - About"), 200


@app.route('/thanks/')
def thanks():
    return render_template('thanks.html', title="Codefly - Thanks"), 200


@app.route('/contact/', methods=['GET', 'POST'])
def contact():
    form = ContactForm()
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')

        body = f"""
        This message sent by contact form:
        Name: {name}
        Email: {email}
        Subject: {subject}
        Message: {message}
        """
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = keys.email
        msg['To'] = keys.email
        msg.set_content(body)

        server = smtplib.SMTP(keys.email_server, 587)
        server.starttls()
        server.login(keys.email, keys.email_pw)
        server.send_message(msg)
        server.quit()

        flash("Message Sent!")
        return redirect(url_for('contact'))

    return render_template('contact.html', title="Codefly - Contact", form=form), 200


class ContactForm(FlaskForm):
    name = StringField()
    email = EmailField()  # validator
    subject = StringField(validators=[DataRequired()])
    message = TextAreaField(validators=[DataRequired()])
    submit = SubmitField('Send')


@app.route('/projects/')
def projects():
    return render_template('projects.html', title="Codefly - Projects"), 200


@app.route('/projects/chat/')
def chat():
    form = BotForm()
    return render_template('chat.html', title="Codefly - Chatbot!", form=form), 200


@app.route('/send/', methods=['GET', 'POST'])
async def send():
    import bot
    default_value = "hi"
    user = request.form.get('send', default_value)
    return bot.reply(user) or "Returned None Somewhere."
    # return "x" if bot.reply(user) is None else bot.reply(user)


class BotForm(FlaskForm):
    chat = StringField(validators=[DataRequired()], name="send")
    submit = SubmitField('Send')


@app.route('/projects/gw2/', methods=['GET', 'POST'])
def gw2():
    return render_template('gw2.html', title="Codefly - Guild Wars 2 Logs"), 200


# @app.errorhandler(Exception)
# def http_exception(e):
#     return render_template('404.html', e=e, title="404"), 404


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', e=e, title="404"), 404


if __name__ == "__main__":
    app.run(debug=True)
