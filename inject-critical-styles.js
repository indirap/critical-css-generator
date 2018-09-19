// Remove all the existing stylesheets
var stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
stylesheets.forEach((stylesheet) => {
    stylesheet.remove();
});

// Add the critical CSS
var criticalStyles = document.createElement("style");
var node = document.createTextNode('<insert critical css>');
criticalStyles.appendChild(node);
document.head.appendChild(criticalStyles);

// After load, re-add all the existing stylesheets and remove critical CSS
window.addEventListener("load", (event) => {
    stylesheets.forEach((stylesheet) => {
        document.head.appendChild(stylesheet);
    });

    criticalStyles.remove();
});