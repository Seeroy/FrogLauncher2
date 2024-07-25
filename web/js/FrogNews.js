class FrogNews {
    // Получить новости
    static getNews = (cb) => {
        $.ajax
        (
            {
                type: "GET",
                url: global.NEWS_URL,
                cache: false,
                dataType: 'json',
                success: cb,
                error: function (xhr, textStatus, thrownError) {
                    console.log("Can`t get news:", textStatus);
                }
            }
        );
    }

    // Загрузить новости в UI
    static loadNewsToUI = () => {
        $(".news .preloader").show();
        $(".news .news-list").hide();
        $(".news .news-list").html("");
        return new Promise(resolve => {
            FrogNews.getNews(news => {
                let placeholder = $(".news .placeholder")[0].outerHTML;
                placeholder = placeholder.replace(' placeholder"', "");
                // По placeholder`у добавляем новые элементы
                news.forEach((item) => {
                    let preparedPlaceholder = placeholder.replaceAll("$1", item.title).replaceAll("$2", item.description).replaceAll("$3", item.date);
                    if (typeof item.url !== "undefined") {
                        preparedPlaceholder = preparedPlaceholder.replaceAll("$4", item.url).replace('class="link" style="display: none;"', 'class="link"');
                    }
                    let backgroundImageCSS = `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.82), rgb(0, 0, 0)), url("${item.picture}")`;
                    $(".news .news-list").append(preparedPlaceholder);
                    $(".news .news-list .news-item:last-child").css("background-image", backgroundImageCSS);
                })
                $(".news .preloader").hide();
                $(".news .news-list").show();
                animateCSSNode($(".news .news-list")[0], "fadeIn");
                resolve(true);
            })
        })
    }
}