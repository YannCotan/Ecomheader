const user = document.getElementById('use')
const subme = document.getElementById('sub-menu')
const close = document.getElementById('close')
const connect = document.getElementById('connected')

close.addEventListener('click' , hide)
user.addEventListener('click' , reveal)


function hide(){

    user.style.opacity = "1"
    user.style.visibility = "visible"
    user.style.display = "flex"

    close.style.opacity = "0"
    close.style.visibility = "hidden"
    close.style.transform = "translateY(2)"
    close.style.display = "none"

    connect.style.transform = "translateX(-5vh)"
    connect.style.opacity = "0"
    connect.style.visibility = "hidden"

    /*subme.style.transform = "translateX(-5vh)"
    subme.style.opacity = "0"
    subme.style.visibility = "hidden"*/
}
function reveal(){
    connect.style.transform = "translateX(0)"
    connect.style.opacity = "1"
    connect.style.visibility = "visible"

    user.style.opacity = "0"
    user.style.visibility = "hidden"
    user.style.display = "none"

    close.style.opacity = "1"
    close.style.visibility = "visible"
    close.style.transform = "translateY(0)"
    close.style.display = "flex"

    /*subme.style.transform = "translateX(0)"
    subme.style.opacity = "1"
    subme.style.visibility = "visible"*/
}

