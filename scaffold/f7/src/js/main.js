;(function(){
    Template7.registerHelper('json_stringify', function (context) {
        return JSON.stringify(context);
    });

    // Initialize your app
    var app = new Framework7({
        animateNavBackIcon: true,
        // Enable templates auto precompilation
        precompileTemplates: true,
        // Enabled pages rendering using Template7
        template7Pages: true,
        // Specify Template7 data for pages
        template7Data: {}
    });

    // Export selectors engine
    var $$ = Dom7;

    // Add main View
    var mainView = app.addView('.view-main', {
        // Enable dynamic Navbar
        dynamicNavbar: true,
    });
    window.app = app;
})();

