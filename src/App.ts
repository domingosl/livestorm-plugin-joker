import Livestorm from '@livestorm/plugin'
const axios = require('axios').default;

const notificationTpl = require('./templates/notification.html').default;
const configTpl = require('./templates/config.html').default;

const jokerName = 'Joker bot';
const appIconURL = 'https://livestorm-ireland-plugin-assets.s3-eu-west-1.amazonaws.com/ee439025-75f8-4d2b-80b2-2b14004baf1e/joker-hat.png';

async function publishJoke(options = { method: 'notification', category: 'Any', blacklist: {} }) {

  let stringBlacklist = "";
  Object.keys(options.blacklist).forEach(key => { if(options.blacklist[key]) stringBlacklist += key + "," });
  stringBlacklist = stringBlacklist.substring(0, stringBlacklist.length - 1);

  const response =  await axios.get('https://v2.jokeapi.dev/joke/'+ options.category +'?blacklistFlags=' + stringBlacklist);

  if(!response || response.error || response.status !== 200 || response.data.error)
    return console.log("Something went wrong!");

  if(response.data.joke)
    publisher(response.data.joke, options.method);

  if(response.data.setup) {

    publisher(response.data.setup, options.method);

    setTimeout(()=>{
      publisher(response.data.delivery, options.method);
    }, 5000);

  }

}


const publisher = (message, method) => {

  if(method === 'notification')
    Livestorm
        .NotificationCenter
        .showIframe(notificationTpl, { content: message.replace(/"/g, '\\\\\"') });

  else if(method === 'chat')
    Livestorm.Chat.send({ user: { firstName: jokerName, avatarUrl: appIconURL },
      text: message
    });
}

export default function() {

  Livestorm.Stage.Buttons.registerShareButton({
    label: 'Share a Joke',
    imageSource: appIconURL,
    onClick: async () => {


      Livestorm.Modal.showIframe({
        template: configTpl,
        onMessage: (message) => {
          console.log(">>>", message);

          if(message['cmd'] === 'shareJoke') {

            publishJoke({
              method: message['data']['method'],
              category: message['data']['joke']['category'],
              blacklist: message['data']['blacklist']
            });

          }

        }
      })


    }
  })

}