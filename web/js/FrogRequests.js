class FrogRequests {
    static get = (url) => {
        return new Promise(resolve => {
            $.get(url, (result) => {
                resolve(result);
            }).fail(error => {
                resolve(false);
            })
        })
    }

    static post = (url, data = {}, contentType = false, processData = false) => {
        return new Promise(resolve => {
            $.ajax({
                url: url,
                type: "POST",
                data: data,
                success: function (response) {
                    resolve(response);
                },
                error: function (e) {
                    console.error(e);
                    resolve(false);
                },
                processData: processData,
                contentType: contentType
            });
        })
    }
}