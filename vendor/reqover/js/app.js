$(document).ready(function () {
    $('#swaggerForm').submit(function (event) {
        // Stop form from submitting normally
        event.preventDefault();

        // Get some values from elements on the page:
        var apiServiceUrl = $('#apiServiceUrl').val();
        var specUrl = $('#specificationUrl').val();
        var basePath = $('#basePath').val();

        var data = {
            type: 'swagger',
            data: {
                serviceUrl: apiServiceUrl,
                specUrl: specUrl,
                basePath: basePath,
            },
        };

        // Send the data using post
        $.ajax({
            type: 'POST',
            url: '/reqover/config',
            dataType: 'json',
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(data),
            success: function (data) {
                window.location.href = '/reqover/swagger/report';
            },
            error: function (xhr, status, error) {
                $('#validationFeedback').text(xhr.responseJSON.error);
                $('#validationFeedback').show();
            },
        });
    });

    $('#grapqhQlForm').submit(function (event) {
        // Stop form from submitting normally
        event.preventDefault();

        // Get some values from elements on the page:
        var graphqlUrl = $('#graphqlUrl').val();

        var data = {
            type: 'graphql',
            data: {
                graphqlUrl: graphqlUrl,
            },
        };

        // Send the data using post
        $.ajax({
            type: 'POST',
            url: '/reqover/graphql/config',
            dataType: 'json',
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(data),
            success: function (data) {
                window.location.href = '/reqover/graphql/report';
            },
            error: function (xhr, status, error) {
                $('#validationFeedbackGQ').text(xhr.responseJSON.error);
                $('#validationFeedbackGQ').show();
            },
        });
    });
});
