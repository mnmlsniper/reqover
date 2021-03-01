$(document).ready(function () {
    $('#configForm').submit(function (event) {
        // Stop form from submitting normally
        event.preventDefault();

        // Get some values from elements on the page:
        var apiServiceUrl = $('#apiServiceUrl').val();
        var specUrl = $('#specificationUrl').val();
        var basePath = $('#basePath').val();

        var data = {
            serviceUrl: apiServiceUrl,
            specUrl: specUrl,
            basePath: basePath,
        };

        // Send the data using post
        $.ajax({
            type: 'POST',
            url: '/config',
            dataType: 'json',
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(data),
            success: function (data) {
                window.location.href = '/report';
            },
        });
    });
});
