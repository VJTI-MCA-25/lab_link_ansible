document.addEventListener('DOMContentLoaded', function() {
    var sidenav = document.querySelectorAll('.sidenav')
    M.Sidenav.init(sidenav, {
        edge: 'left',
        draggable: true,
    });
});