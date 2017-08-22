/*!
 * Conditional comments for article pages
 * @author Chris Burnell <me@chrisburnell.com>
 */


(() => {

    'use strict';


    const DISQUS_SHORTNAME = 'chrisburnell';
    const commentsSection = document.querySelector('.js-comments');
    const commentsButton = document.querySelector('.js-show-comments');
    // `#comment` will match both `#comment` and `#comments`
    const commentsHash = ['#comment', '#disqus_thread'];

    // if Comments Button exists, enable it and attach Event Listener
    if (commentsButton !== null) {
        commentsButton.disabled = false;
        commentsButton.setAttribute('aria-disabled', 'false');
        commentsButton.addEventListener('click', showComments);
    }

    // run `updateFromHash()` on window load
    window.addEventListener('load', updateFromHash);
    // run `updateFromHash()` on window hashchange
    window.addEventListener('hashchange', updateFromHash);
    // if URL contains a hash from `commentsHash`, initiate `showComments()`
    function updateFromHash() {
        for (let hash of commentsHash) {
            if (window.location.hash.indexOf(hash) === 0) {
                showComments();
            }
        }
    }

    // Load in Disqus comments and remove the comments button
    function showComments() {
        if (commentsSection !== null) {
            // only if the button still exists should we load and hide the button
            if (commentsButton !== null && commentsButton.getAttribute('aria-hidden') === 'false') {
                commentsButton.setAttribute('aria-pressed', 'true');
                commentsButton.setAttribute('aria-expanded', 'true');
                commentsButton.setAttribute('aria-hidden', 'true');
                commentsButton.removeEventListener('click', () => {});
                (() => {
                    const DISQUS_SCRIPT = document.createElement('script');
                    DISQUS_SCRIPT.type = 'text/javascript';
                    DISQUS_SCRIPT.async = true;
                    DISQUS_SCRIPT.src = `//${DISQUS_SHORTNAME}.disqus.com/embed.js`;
                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(DISQUS_SCRIPT);
                })();
                commentsSection.setAttribute('aria-hidden', 'false');
                commentsSection.scrollIntoView();
            }
        }
    }

})();