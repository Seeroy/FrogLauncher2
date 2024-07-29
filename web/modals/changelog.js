const changelog_pageLimit = 15;
let changelog_currentPage = 1;
let changelog_endOfPage = false;

const CHANGELOG_PRELOADER_PLACEHOLDER = `<h3 class='placeholder'>${global.MESSAGES.loading.progress}</h3>`;
const CHANGELOG_FAILED_PLACEHOLDER = "<h3 class='placeholder'>${global.MESSAGES.loading.failed}</h3>";
const CHANGELOG_ITEM_PLACEHOLDER = `<div class="item"><h1>$1</h1><h3>$2</h3><h5>$3</h5></div>`;

$(function () {
    $(document).on("showModalEvent", (e) => {
        if (e.originalEvent.detail.modal === "changelog" && $(".list .item").length === 0) {
            FrogChangelogUI.loadReleases();
        }
    })
})

$("#modal-changelog .wrapper").scroll(function (e) {
    let wrapper = $("#modal-changelog .wrapper")[0];
    if (wrapper.offsetHeight + wrapper.scrollTop >= wrapper.scrollHeight) {
        FrogChangelogUI.addPlaceholder();
        changelog_currentPage++;
        FrogChangelogUI.loadReleases();
    }
});

class FrogChangelogUI {
    static getReleases = (cb) => {
        $.get(`https://api.github.com/repos/Seeroy/FrogLauncher/releases?per_page=${changelog_pageLimit}&page=${changelog_currentPage}`, cb).fail(() => {
            $(".list").html(CHANGELOG_FAILED_PLACEHOLDER);
        });
    }

    static loadReleases = () => {
        if (changelog_endOfPage === true) {
            return;
        }

        FrogChangelogUI.getReleases((releases) => {
            if (releases !== false && Array.isArray(releases)) {
                releases.forEach((release) => {
                    $("#modal-changelog .list").append(CHANGELOG_ITEM_PLACEHOLDER.replaceAll("$1", release.name).replaceAll("$2", release.body.replaceAll("\n", "<br>")).replaceAll("$3", release.published_at));
                    if (release.tag === "v1.0.0") {
                        changelog_endOfPage = true;
                    }
                });
            }
            FrogChangelogUI.removePlaceholder();
        })
    }

    static addPlaceholder = () => {
        return $("#modal-changelog .list").append(CHANGELOG_PRELOADER_PLACEHOLDER);
    }

    static removePlaceholder = () => {
        return $("#modal-changelog .list .placeholder").remove();
    }
}