let menuButton = document.querySelector('#menuButton');
let menuBackdrop = document.querySelector('#menuBackdrop');
let menuClose = document.querySelector('#menuClose');
menuButton.addEventListener('click', ()=>{
    if (menuBackdrop.style.display === "block") {
        menuBackdrop.style.display = "none"
    } else {
        menuBackdrop.style.display = "block"
    }
})
menuBackdrop.addEventListener('click', (e)=> {
    if (e.target === menuBackdrop) {
        menuBackdrop.style.display = "none";
    }
})
menuClose.addEventListener('click', ()=>{
    menuBackdrop.style.display = "none"
})