/*!
 * Conditional webmentions for article pages
 * @author Chris Burnell <me@chrisburnell.com>
 */


(() => {

    'use strict';


    const CANONICAL_URL = document.querySelector('link[rel="canonical"]').getAttribute('href');
    const WEBMENTIONS_SECTION = document.querySelector('.js-webmentions');
    const WEBMENTIONS_BUTTON = document.querySelector('.js-show-webmentions');
    const WEBMENTIONS_INPUT = document.querySelector('.js-webmentions-input');
    const WEBMENTIONS_SUBMIT = document.querySelector('.js-webmentions-submit');
    const WEBMENTIONS_THREAD = document.querySelector('.js-webmentions-thread');
    // `#webmention` will match both `#webmention` and `#webmentions`
    const WEBMENTIONS_HASH = ['#webmention', '#mention'];
    const WEBMENTIONS_TEMPLATE =
        `<li id="webmention-{{ id }}" class="webmentions__item" data-type="{{ type }}">
            {{ content }}
            {{ typeLink }}
            {{ author }}
            {{ date }}
        </li>`;
    let webmentionsLoaded = false;
    let webmentionsCount = 0;
    let observer = new IntersectionObserver(checkVisibility);

    // initiate WebMentions if hash present on load
    window.addEventListener('load', helpers.actionFromHash(WEBMENTIONS_HASH, showWebmentionsAndJump));
    // initiate WebMentions if hash present on hash change
    window.addEventListener('hashchange', helpers.actionFromHash(WEBMENTIONS_HASH, showWebmentionsAndJump));

    if (WEBMENTIONS_SECTION !== null) {
        // enable the WebMentions button, input, and submit
        helpers.enableElement(WEBMENTIONS_BUTTON, showWebmentions);
        WEBMENTIONS_BUTTON.addEventListener('mouseover', () => {
            if (webmentionsLoaded === false) {
                loadWebmentions();
            }
        });
        helpers.enableElement(WEBMENTIONS_INPUT);
        helpers.enableElement(WEBMENTIONS_SUBMIT);
        // observe the WebMentions button to load in data
        observer.observe(WEBMENTIONS_BUTTON);
    }

    function checkVisibility(entries, observer) {
        entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
                showWebmentions();
                observer.disconnect();
            }
        });
    }

    function loadWebmentions() {
        // made the request to webmention.io
        let request = new XMLHttpRequest();
        request.open('GET', `https://webmention.io/api/mentions?jsonp&target=${CANONICAL_URL}`, true);
        request.onload = function() {
            if (webmentionsLoaded === false && request.status >= 200 && request.status < 400 && request.responseText.length > 0) {
                // Success!
                webmentionsLoaded = true;
                // prevent hovering the button from continuing to fire
                WEBMENTIONS_BUTTON.removeEventListener('mouseover', () => {});
                // prevent the observer from continuing to fire
                observer.disconnect();
                let data = JSON.parse(request.responseText);
                for (let link of data.links.reverse()) {
                    if (link.verified === true && link.private === false) {
                        webmentionsCount++;
                        WEBMENTIONS_THREAD.innerHTML += populateWebmentionContent(WEBMENTIONS_TEMPLATE, link);
                    }
                }
                if (WEBMENTIONS_BUTTON !== null && webmentionsCount > 0) {
                    WEBMENTIONS_BUTTON.querySelector('.js-webmention-comment-count').innerHTML = `${webmentionsCount} mention${webmentionsCount > 1 ? 's' : ''}`;
                }
            }
            else {
                console.log(`WebMention request status error: ${request.status}`);
            }
        };
        request.onerror = function() {
            console.log('WebMention request error');
        };
        request.send();
    }

    function showWebmentions() {
        // check if already loaded the webmentions, if not, load it (again)
        if (webmentionsLoaded === false) {
            loadWebmentions();
        }
        // only if the button still exists should we hide the button
        if (WEBMENTIONS_BUTTON !== null && WEBMENTIONS_BUTTON.getAttribute('aria-hidden') === 'false') {
            WEBMENTIONS_BUTTON.setAttribute('aria-pressed', 'true');
            WEBMENTIONS_BUTTON.setAttribute('aria-expanded', 'true');
            WEBMENTIONS_BUTTON.setAttribute('aria-hidden', 'true');
            WEBMENTIONS_BUTTON.removeEventListener('click', () => {});
        }
        WEBMENTIONS_SECTION.setAttribute('aria-hidden', 'false');
    }

    function showWebmentionsAndJump() {
        showWebmentions();
        WEBMENTIONS_SECTION.scrollIntoView();
        if (webmentionsCount > 1) {
            WEBMENTIONS_THREAD.focus();
        }
        else {
            WEBMENTIONS_INPUT.focus();
        }
    }

    ////
    /// Add results content to WebMention template
    /// @param {String} html
    /// @param {object} item
    /// @return {String} Populated HTML
    ////
    function populateWebmentionContent(html, item) {
        // ID
        html = helpers.injectContent(html, item.id, '{{ id }}');

        // TYPE
        html = helpers.injectContent(html, item.activity.type, '{{ type }}');
        html = helpers.injectContent(html, `<a href="${item.data.url}" class="webmentions__item__activity" rel="external">{{ typePrefix }}</a>`, '{{ typeLink }}');
        if (item.activity.type === 'like') {
            html = helpers.injectContent(html, 'Liked', '{{ typePrefix }}');
        }
        else if (item.activity.type === 'reply') {
            html = helpers.injectContent(html, 'Replied', '{{ typePrefix }}');
        }
        else if (item.activity.type === 'repost') {
            html = helpers.injectContent(html, 'Reposted', '{{ typePrefix }}');
        }
        else {
            html = helpers.injectContent(html, 'Posted', '{{ typePrefix }}');
        }

        // CONTENT / URL
        if (item.activity.type === 'like' || item.activity.type === 'repost') {
            html = helpers.injectContent(html, '', '{{ content }}');
        }
        else if (item.activity.type === 'reply' && item.data.content) {
            html = helpers.injectContent(html, `<div><q>${item.data.content}</q></div>`, '{{ content }}');
        }
        else {
            html = helpers.injectContent(html, `<div><a href="${item.data.url}" rel="external">${item.data.url.split('//')[1]}</a></div>`, '{{ content }}');
        }

        // AUTHOR
        if (item.data.author.name && item.data.author.url && item.data.author.url.includes('//twitter.com')) {
            html = helpers.injectContent(html, `by <a href="${item.data.author.url}" class="webmentions__item__name" rel="external"><img class="webmentions__item__image" src="${item.data.author.url}/profile_image?size=normal" alt="">${item.data.author.name}</a>`, '{{ author }}');
        }
        else if (item.data.author.name && item.data.author.url && item.data.url.includes('//twitter.com')) {
            html = helpers.injectContent(html, `by <a href="${item.data.author.url}" class="webmentions__item__name" rel="external"><img class="webmentions__item__image" src="${item.data.url.split('status')[0]}/profile_image?size=normal" alt="">${item.data.author.name}</a>`, '{{ author }}');
        }
        else if (item.data.author.name && item.data.author.url) {
            html = helpers.injectContent(html, `by <a href="${item.data.author.url}" class="webmentions__item__name" rel="external">${item.data.author.name}</a>`, '{{ author }}');
        }
        else if (item.data.author.name) {
            html = helpers.injectContent(html, `by <span class="webmentions__item__name">${item.data.author.name}</span>`, '{{ author }}');
        }
        else if (item.data.name) {
            html = helpers.injectContent(html, `by <span class="webmentions__item__name">${item.data.name}</span>`, '{{ author }}');
        }
        else {
            html = helpers.injectContent(html, '', '{{ author }}');
        }

        // DATE
        html = helpers.injectContent(html, `on <time class="webmentions__item__time" datetime="${item.data.published ? item.data.published : item.verified_date}">${helpers.formatDate(new Date(item.data.published ? item.data.published : item.verified_date))} <small>@</small> ${helpers.formatTime(new Date(item.data.published ? item.data.published : item.verified_date))}</time>`, '{{ date }}');

        return html;
    }

})();
