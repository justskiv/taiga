/* Feed "N more guides" reveal: unhide the hidden tail of the feed and drop the
   button. Generic and inert when there is nothing to reveal (fewer posts than
   feedInitial, so no .feed-more block was rendered). */
export function initFeedReveal() {
  const more = document.querySelector('.feed-more');
  const btn = document.getElementById('feedMore');
  if (!more || !btn) return;
  btn.addEventListener('click', function () { more.hidden = false; btn.remove(); });
}
