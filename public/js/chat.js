const socket = io()

const $sendForm = document.querySelector("#send-form")
const $sendFormInput = $sendForm.querySelector('input')
const $sendFormButton = $sendForm.querySelector('button')
const $sendLocationButton = document.querySelector("#send-location")
const $messagesDiv = document.querySelector('#messages')
const $sidebarDiv = document.querySelector('#sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    const $newMsg = $messagesDiv.lastElementChild

    const newMsgStyles = getComputedStyle($newMsg)
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin

    const visibleHeight = $messagesDiv.offsetHeight
    const msgContainerHeight = $messagesDiv.scrollHeight
    const scrollOffset = $messagesDiv.scrollTop + visibleHeight

    if((msgContainerHeight - newMsgHeight) <= scrollOffset) {
        $messagesDiv.scrollTop = $messagesDiv.scrollHeight
    }


}

socket.on("locationMessage", (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, { 
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messagesDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on("message", (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, { 
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a') 
    })
    $messagesDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebarDiv.innerHTML = html
})

$sendForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $sendFormButton.setAttribute('disabled', 'disabled')
    
    const message = e.target.elements.message.value
    socket.emit("sendMessage", message, (error) => {

        $sendFormButton.removeAttribute('disabled')
        $sendFormInput.value = ''
        $sendFormInput.focus()

        if(error) {
            return console.log(error)
        }
        console.log("Delivered!")
    })
})

$sendLocationButton.addEventListener("click", () => {
    if(!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser")
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const result = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        socket.emit("sendLocation", result, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log("Location Shared!")
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})