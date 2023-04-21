/**
 * We store the extension's options in Chrome storage because it provides a
 * way to persistently store data across browser sessions. However, only content
 * scripts have access to the Chrome storage API, so we use a custom event to
 * make the options accessible to the page scripts.
 */

// Initialize an object to store the extension's options and assign default
// values.
const OPTIONS = {
  'jkToEsc': true,
};
// Register an event listener for a custom event that content scripts will
// dispatch when the options change. When the event is received, we update the
// OPTIONS object with the new values.
window.addEventListener('optionChangeEvent', event => {
	for (const [key, value] of Object.entries(event.detail.options)) {
		OPTIONS[key] = value;
	}
});

