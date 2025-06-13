(()=>{var e={621:()=>{NodeList.prototype.forEach||(NodeList.prototype.forEach=Array.prototype.forEach),Array.prototype.includes||Object.defineProperty(Array.prototype,"includes",{enumerable:!1,value:function(e){return this.filter((function(t){return t===e})).length>0}}),Element.prototype.matches||(Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector),Element.prototype.closest||(Element.prototype.closest=function(e){var t=this;do{if(Element.prototype.matches.call(t,e))return t;t=t.parentElement||t.parentNode}while(null!==t&&1===t.nodeType);return null})}},t={};function r(o){var n=t[o];if(void 0!==n)return n.exports;var c=t[o]={exports:{}};return e[o](c,c.exports,r),c.exports}(()=>{"use strict";var e=function(e,t){if(e&&t){var r="true"===e.getAttribute(t)?"false":"true";e.setAttribute(t,r)}};r(621),document.addEventListener("DOMContentLoaded",(function(){var t,r,o,n;t=document.querySelector("#toggle-menu"),r=document.querySelector("#close-menu"),o=document.querySelector("#header-navigation"),n=function(r){r.preventDefault(),e(t,"aria-expanded"),t.classList.toggle("is-active"),o.classList.toggle("js-show")},t&&r&&o&&[t,r].forEach((function(e){e.addEventListener("click",n)})),function(){var t=document.querySelector("#toggle-search"),r=document.querySelector("#close-search"),o=document.querySelector("#wrap-search"),n=document.querySelector("#content-header"),c=function(r){r.preventDefault(),e(t,"aria-expanded"),t.classList.toggle("is-active"),o.classList.toggle("js-show"),n.classList.toggle("js-show")};t&&r&&[t,r].forEach((function(e){e.addEventListener("click",c)}))}()}))})()})();

function toggleFilters() {
    var filterContent = document.getElementById("filterContent");
    var toggleButton = document.querySelector(".filter-toggle");
    var arrowIcon = document.querySelector(".arrow-icon");

    if (filterContent.classList.contains("show")) {
        filterContent.classList.remove("show");
        toggleButton.textContent = "Show filters";
        arrowIcon.classList.remove("rotated");
    } else {
        filterContent.classList.add("show");
        toggleButton.textContent = "Hide filters";
        arrowIcon.classList.add("rotated");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const applyButton = document.querySelector('.apply-button');
    applyButton.addEventListener('click', function() {
        applyFilters(); // Apply filters only when the button is clicked
    });

    const clearButton = document.getElementById('clear-all-link');
    clearButton.addEventListener('click', function() {
        clearFilters(); // Clear all filters when the button is clicked
    });

    handleClearAllLink();
});

function applyFilters() {
    const selectedPhases = Array.from(document.querySelectorAll('input[name="phase"]:checked')).map(input => input.value);
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(input => input.value);
    const selectedRequirement = document.querySelector('input[name="requirement"]:checked');
    const requirementValue = selectedRequirement ? selectedRequirement.value : null;

    const cards = document.querySelectorAll('.card-link');
    let visibleCount = 0;

    cards.forEach(card => {
        const phaseEds = (card.getAttribute("data-phases") || '').split("|");
        const categories = (card.getAttribute("data-categories") || '').split("|");
        const requirement = card.getAttribute("data-requirement");

        let checker = (arr, target) => target.some(v => arr.includes(v));

        let hasSelectedPhaseEds = checker(phaseEds, selectedPhases) || !selectedPhases.length;
        let hasSelectedCategories = checker(categories, selectedCategories) || !selectedCategories.length;
        let hasSelectedRequirement = requirement === requirementValue || !requirementValue;

        if (hasSelectedPhaseEds && hasSelectedCategories && hasSelectedRequirement) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const monthHeaders = Array.from(document.querySelectorAll('.govuk-summary-card__title'));
    monthHeaders.forEach(monthHeader => {
        const monthWrapper = monthHeader.closest('.month-wrapper');
        const cardLinks = Array.from(monthWrapper.querySelectorAll('.card-link'));
        const filtered = cardLinks.filter(cardLink => cardLink.style.display === 'block');

        if (!filtered.length) {
            monthWrapper.style.display = 'none';
        } else {
            monthWrapper.style.display = 'block';
        }
    });

    // Update the filtered count display
    const filteredCountElement = document.getElementById('filtered-count');
    if (selectedPhases.length || selectedCategories.length || requirementValue) {
        filteredCountElement.textContent = `Showing ${visibleCount} results in`;
        filteredCountElement.style.display = 'block';
    } else {
        filteredCountElement.style.display = 'none';
    }

    handleClearAllLink();
    updateSelectedFilters(); // Ensure this is called to update the selected filters display
}

function clearFilters() {
    const selectedPhases = document.querySelectorAll('input[name="phase"]:checked');
    selectedPhases.forEach(phase => phase.checked = false);

    const selectedCategories = document.querySelectorAll('input[name="category"]:checked');
    selectedCategories.forEach(category => category.checked = false);

    const selectedRequirement = document.querySelector('input[name="requirement"]:checked');
    if (selectedRequirement) {
        selectedRequirement.checked = false;
    }

    const cards = document.querySelectorAll('.card-link');
    cards.forEach(card => {
        card.style.display = 'block';
    });

    const monthWrappers = document.querySelectorAll('.month-wrapper');
    monthWrappers.forEach(monthWrapper => {
        monthWrapper.style.display = 'block';
    });

    const clearButton = document.getElementById('clear-all-link');
    clearButton.style.display = 'none';

    // Reset the filtered count display
    const filteredCountElement = document.getElementById('filtered-count');
    filteredCountElement.textContent = '0 results found';
    filteredCountElement.style.display = 'none';

    updateSelectedFilters(); // Ensure this is called to update the selected filters display
}

function handleClearAllLink() {
    const selectedPhases = Array.from(document.querySelectorAll('input[name="phase"]:checked')).map(input => input.value);
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(input => input.value);
    const selectedRequirement = document.querySelector('input[name="requirement"]:checked');
    const requirementValue = selectedRequirement ? selectedRequirement.value : null;

    const clearButton = document.getElementById('clear-all-link');
    if (!selectedPhases.length && !selectedCategories.length && !requirementValue) {
        clearButton.style.display = 'none';
    } else {
        clearButton.style.display = 'block';
    }

    updateSelectedFilters();
}

function updateSelectedFilters() {
    const selectedPhases = Array.from(document.querySelectorAll('input[name="phase"]:checked')).map(input => input.labels[0].textContent);
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(input => input.labels[0].textContent);
    const selectedRequirement = document.querySelector('input[name="requirement"]:checked');
    const requirementValue = selectedRequirement ? selectedRequirement.labels[0].textContent : null;

    const selectedFiltersContainer = document.getElementById('selected-filters');
    selectedFiltersContainer.innerHTML = '';

    const allSelectedFilters = [...selectedPhases, ...selectedCategories];
    if (requirementValue) {
        allSelectedFilters.push(requirementValue);
    }

    allSelectedFilters.forEach(filter => {
        const filterSpan = document.createElement('span');
        filterSpan.classList.add('filter-label');

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-filter-button');
        removeButton.textContent = '×';
        removeButton.onclick = () => {
            removeFilter(filter);
        };

        filterSpan.appendChild(removeButton);
        filterSpan.appendChild(document.createTextNode(filter));
        selectedFiltersContainer.appendChild(filterSpan);
    });
}

function removeFilter(filter) {
    const phaseCheckbox = Array.from(document.querySelectorAll('input[name="phase"]')).find(input => input.labels[0].textContent === filter);
    const categoryCheckbox = Array.from(document.querySelectorAll('input[name="category"]')).find(input => input.labels[0].textContent === filter);
    const requirementRadio = Array.from(document.querySelectorAll('input[name="requirement"]')).find(input => input.labels[0].textContent === filter);

    if (phaseCheckbox) {
        phaseCheckbox.checked = false;
    }
    if (categoryCheckbox) {
        categoryCheckbox.checked = false;
    }
    if (requirementRadio) {
        requirementRadio.checked = false;
    }

    // Re-apply filters after a filter is removed
    applyFilters();
} 