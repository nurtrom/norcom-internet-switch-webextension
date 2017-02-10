const APP_NAME = 'Norcom Internet Switch';

const STATE_ICONS = [
    {
        19: 'icons/internet-disabled-19.png',
        38: 'icons/internet-disabled-38.png'
    },

    {
        19: 'icons/internet-enabled-19.png',
        38: 'icons/internet-enabled-38.png'
    }
];

const STATE_TITLES = [
    'Включить интернет Norcom',
    'Выключить интернет Norcom'
];

const STATE_CHANGE_NOTIFICATIONS = [
    {
        type: 'basic',
        iconUrl: browser.extension.getURL('icons/internet-disabled-96.png'),
        title: APP_NAME
    },

    {
        type: 'basic',
        iconUrl: browser.extension.getURL('icons/internet-enabled-96.png'),
        title: APP_NAME
    }
];

function main() {
    let stateChangeTimeout;
    let state = 0;

    browser.browserAction.onClicked.addListener(() => {
        state = +!state;

        updateView(state);

        if (stateChangeTimeout) {
            clearTimeout(stateChangeTimeout);
        }

        stateChangeTimeout = setTimeout(() => {
            toggleInternet(state).then((res) => {
                res.text().then((content) => {
                    let message = parseMessage(content);

                    showNotification(state, message);
                });
            });


        }, 500);
    });

    updateView(state);
}

function updateView(state) {
    return [updateIcon(state), updateTitle(state)];
}

function updateIcon(state) {
    let path = STATE_ICONS[state];
    return browser.browserAction.setIcon({path});
}

function updateTitle(state) {
    let title = STATE_TITLES[state];
    return browser.browserAction.setTitle({title});
}

function getEndpointUrl(state) {
    return `http://www.norcom.ru/core/keeper.php?act=keeper_change_status&status=${+!state}`;
}

function toggleInternet(state) {
    let url = getEndpointUrl(state);
    let req = new Request(url, {method: 'GET'});

    return fetch(req);
}

function parseMessage(content) {
    let matches = content.match(/<span[^>]*>(.*?)<\/span>/);

    if (matches && matches[1]) {
        let message = matches[1];

        return message.replace(/(<([^>]+)>)/ig, '');
    }

    return null;
}

function showNotification(state, message) {
    var options = STATE_CHANGE_NOTIFICATIONS[state];
    options.message = message;

    browser.notifications.create('norcom-internet-switch-notification', options);
}

main();