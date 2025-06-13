function toggleFilters() {
    var filterContent = document.getElementById("filterContent");
    var toggleButton = document.querySelector(".filter-toggle");
    
    if (filterContent.classList.contains("show")) {
        filterContent.classList.remove("show");
        toggleButton.textContent = "Show filters";
    } else {
        filterContent.classList.add("show");
        toggleButton.textContent = "Hide filters";
    }
}