class FrogRequests {
    static get = (url) => {
        return new Promise(resolve => {
            $.get(url, (response) => {
                resolve([true, response]);
            }).fail(e => {
                resolve([false, e]);
            })
        })
    }

    static post = (url, data = {}, contentType = false, processData = false) => {
        return new Promise(resolve => {
            $.ajax({
                url: url,
                type: "POST",
                data: data,
                success: (response) => {
                    resolve([true, response]);
                },
                error: (e) => {
                    console.error(e);
                    resolve([false, e]);
                },
                processData: processData,
                contentType: contentType
            });
        })
    }
}