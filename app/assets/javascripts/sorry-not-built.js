function alertUser(evt) {
    evt.preventDefault();
    alert('Sorry, this has not been built yet');
}

$('body').on('click', 'a[href="#")', alertUser);