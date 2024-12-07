var animationSpeed = 750;
var library = [];

$(document).ready(function () {
    attachAnimations();
});

/* -----------------------------------------------------------------------------
    FILL PAGE HTML 
   ---------------------------------------------------------------------------*/
async function fillLibrary(searchQuery, mediaType, page) {
    await assembleData(searchQuery, mediaType, page); // Убедитесь, что эта строка выполняется
    if (library.length === 0) {
        console.error('Data was not found');
        $('.no-found-container').css('display', 'flex');
        return;
    }
    $('.library').empty();
    var classlist = ['left-side first', 'left-side', 'left-side', 'right-side', 'right-side', 'right-side last'];
    library.forEach(async function (item) {
        const titleInfo = await getDetailedInfo(item.imdbID);
        const elementLayout = `
            <li class="media ${classlist[0]}">
                <div class="cover">
                    <img src="${item.cover}" alt="${item.title}" />
                </div>
                <div class="summary">
                    <h1>${item.title} (${titleInfo.Country + `, ` + titleInfo.Year})</h1>
                    <span>${titleInfo.Genre}</span>
                    <h2>by ${titleInfo.Director}</h2>
                    <h3>Actors: ${titleInfo.Actors}</h3>
                    <h3>Writers: ${titleInfo.Writer}</h3>
                    <p>${titleInfo.Plot}</p>
                </div>
            </li>
        `;
        $('.library').append(elementLayout);
        // shift the classlist array for the next iteration
        var cn = classlist.shift();
        classlist.push(cn);
    });
}
/* -----------------------------------------------------------------------------
    BUILD LIBRARY ARRAY 
   ---------------------------------------------------------------------------*/

function Media(cover, title, imdbID) {
    this.cover = cover;
    this.title = title;
    this.imdbID = imdbID
    library.push(this);
}
const API_KEY = '1ea4f156';
const BASE_URL = 'http://www.omdbapi.com/';

async function getDetailedInfo(imdbID) {
    try {
        const response = await $.ajax({
            url: `${BASE_URL}`,
            method: 'GET',
            data: {
                apikey: API_KEY,
                i: imdbID
            }
        });
        
        if (response.Response === "True") {
            return response; // Возвращаем детальную информацию о фильме
        } else {
            throw new Error(response.Error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

async function fetchMovies(searchQuery, type, page = 1, bGettotalResults = false) {
    try {
        const response = await $.ajax({
            url: `${BASE_URL}`,
            method: 'GET',
            data: {
                apikey: API_KEY,
                s: searchQuery,
                type: type,
                page: page
            }
        });
        
        if (response.Response === "True") {
            return bGettotalResults ? response.totalResults : response.Search;
        } else {
            console.error('Data was not found');
            $('.no-found-container').css('display', 'flex');
            throw new Error(response.Error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

async function assembleData(searchQuery, mediaType, page) {
    library = [];
    try {
        const recivedTitles = await fetchMovies(searchQuery, mediaType, page);
        recivedTitles.forEach(movie => {
            new Media(
                movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/150',
                movie.Title,
                movie.imdbID
            );
        });
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function clearContent() {
    $('.start-container').hide();
    $('.no-found-container').hide();
    $('.empty-query-container').hide();
    $('.library').empty();
    $('#pagination-container').hide()
}

async function createSearchQuery() {
    const searchQuery = $('#searchQuery').val();
    const mediaType = $('#mediaType').val().toLowerCase();
    clearContent();

    if (searchQuery.trim() === '') {
        $('.empty-query-container').css('display', 'flex');
        return;
    }
    $('#pagination-container').show()
    initializePagination(searchQuery, mediaType)
}

/* -----------------------------------------------------------------------------
    PAGINATION INITIALIZATION
   ---------------------------------------------------------------------------*/
function initializePagination(searchQuery, mediaType) {
    fetchMovies(searchQuery, mediaType, 1, true).then(totalResults => {
        const totalPages = Math.ceil(totalResults / 10);

        $('#pagination-container').pagination({
            dataSource: Array.from({ length: totalPages }, (_, i) => i + 1),
            pageSize: 1,
            showPageNumbers: true,
            showPrevious: true,
            showNext: true,
            prevText: '←',
            nextText: '→',
            callback: function (data, pagination) {
                const currentPage = data[0]
                fillLibrary(searchQuery, mediaType, currentPage);
            }
        });
    });
}


/* -----------------------------------------------------------------------------
    ANIMATION 
   ---------------------------------------------------------------------------*/
function attachAnimations() {
    // Делегирование события на родительский контейнер .library
    $('.library').on('click', '.media', function () {
        if (!$(this).hasClass('selected')) {
            selectAnimation($(this));
        }
    });

    // Делегирование события на родительский контейнер .library для cover
    $('.library').on('click', '.media .cover', function () {
        if ($(this).parent().hasClass('selected')) {
            deselectAnimation($(this).parent());
        }
    });
}

function selectAnimation(obj) {
    obj.addClass('selected');
    // elements animating
    var cover = obj.find('.cover');
    var image = obj.find('.cover img');
    var library = $('.library');
    var summaryBG = $('.overlay-summary');
    var summary = obj.find('.summary');
    // animate media cover
    cover.animate({
        width: '300px',
        height: '468px'
    }, {
        duration: animationSpeed
    });
    image.animate({
        width: '280px',
        height: '448px',
        borderWidth: '10px'
    }, {
        duration: animationSpeed
    });
    // add fix if the selected item is in the bottom row
    if (isBtmRow()) {
        library.css('paddingBottom', '234px');
    }
    // slide page so media always appears
    positionTop();
    // add background overlay
    $('.overlay-page').show();
    // locate summary overlay    
    var px = overlayVertPos();
    summaryBG.css('left', px);
    // animate summary elements
    var ht = $('.content').height();
    var pos = $('.media.selected').position();
    var start = pos.top + 30; // 10px padding-top on .media + 20px padding of .summary
    var speed = Math.round((animationSpeed / ht) * 450); // 450 is goal height
    summaryBG.show().animate({
        height: ht + 'px'
    }, {
        duration: animationSpeed,
        easing: 'linear',
        step: function (now, fx) {
            if (now > start && fx.prop === "height") {
                if (!summary.is(':animated') && summary.height() < 450) {
                    summary.show().animate({
                        height: '450px'
                    }, {
                        duration: speed,
                        easing: 'linear'
                    });
                }

            }
        }

    });
}

function deselectAnimation(obj) {
    // elements animating
    var cover = obj.find('.cover');
    var image = obj.find('.cover img');
    var library = $('.library');
    var summaryBG = $('.overlay-summary');
    var summary = obj.find('.summary');
    // stop summary animation
    summary.stop();
    // animate media cover
    cover.stop().animate({
        width: '140px',
        height: '224px'
    }, {
        duration: animationSpeed
    });
    image.stop().animate({
        width: '140px',
        height: '224px',
        borderWidth: '0px'
    }, {
        duration: animationSpeed,
        complete: function () {
            obj.removeClass('selected');
        }
    });
    // remove fix for bottom row, if present
    library.stop().animate({
        paddingBottom: '10px'
    }, {
        duration: animationSpeed
    });
    // remove background overlay and summary
    var ht = summaryBG.height();
    var pos = $('.media.selected').position();
    var start = pos.top + 480; //10px of top padding + 470px for .summary height + padding
    var speed = Math.round((animationSpeed / ht) * summary.height());
    summaryBG.stop().animate({
        height: '0px'
    }, {
        duration: animationSpeed,
        easing: 'linear',
        step: function (now, fx) {
            if (now < start && fx.prop === "height") {
                if (!summary.is(':animated') && summary.height() > 0) {
                    summary.animate({
                        height: '0px'
                    }, {
                        duration: speed,
                        easing: 'linear',
                        complete: function () {
                            summary.hide();
                        }
                    });
                }

            }
        },
        complete: function () {
            $('.overlay-page').hide();
            summary.hide(); // catching this twice to insure for aborted animation
            summaryBG.hide();
        }
    });
}

function isBtmRow() {
    var pos = $('.media.selected').position();
    var libHgt = $('.content').height();
    if (libHgt - pos.top === 254) { // this is current height of the media, plus 30 for padding on the media and library
        return true;
    } else {
        return false;
    }
}

function positionTop() {
    var offset = $('.media.selected').offset();
    var bTop = offset.top;
    $('html, body').animate({ scrollTop: bTop }, animationSpeed);
}

function overlayVertPos() { // determines the vertical position for the summary overlay based on selection position
    var pos = $('.media.selected').position();
    switch (pos.left) {
        case 0:
            return '320px';
        case 160:
            return '320px';
        case 320:
            return '480px';
        case 480:
            return '0px';
        case 640:
            return '160px';
        case 800:
            return '160px';
        default:
            return false;
    }
}