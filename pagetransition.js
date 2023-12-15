// script.js
var nextLink = document.getElementById('next-link');
var prevLink = document.getElementById('prev-link');
var currentPage = document.getElementsByTagName('body')[0];

function goToNextPage(event) {
	event.preventDefault();
	currentPage.classList.add('page-exit-active');
	setTimeout(function() {
		window.location.href = event.target.href;
	}, 5000);
}

function goToPrevPage(event) {
	event.preventDefault();
	currentPage.classList.add('page-exit-active');
	setTimeout(function() {
		window.location.href = event.target.href;
	}, 5000);
}

nextLink.addEventListener('click', goToNextPage);
prevLink.addEventListener('click', goToPrevPage);
