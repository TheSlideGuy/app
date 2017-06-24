'use strict';
const patch = window.snabbdom.init([window.snabbdom_class.classModule, window.snabbdom_props.propsModule, window.snabbdom_style.styleModule, window.snabbdom_eventlisteners.eventListenersModule]);
const h = window.h.h;


// --- Model
const model = {
  page: 'presenter',
  slideNumber: 0, // 0 indexed!!
  loadedSlides: 
  [ `Light of the world, You step down into darkness.
     Opened my eyes let me see.`

  , `Beauty that made this heart adore you
     hope of a life spent with you.`

  , `And here I am to worship,
     Here I am to bow down,
     Here I am to say that you're my God,`

  , `You're altogether lovely,
     Altogether worthy,
     Altogether wonderful to me.`
]};


// --- Update
// We really should be returning a persistent data structure here
// (Update) -> void
function reduceUpdate(updateOp) {
  switch (updateOp.method) {
    case 'setPage':
      model.page = updateOp.page;
      break;

    
    case 'nextSlide':
      model.slideNumber++;
      model.slideNumber = Util.constrainMax(model.loadedSlides.length - 1, model.slideNumber);
      pushCmd({method: 'sendSlide'});
      break;
    case 'prevSlide':
      model.slideNumber--;
      model.slideNumber = Util.constrainMin(0, model.slideNumber);
      pushCmd({method: 'sendSlide'});
      break;
    case 'setSlide':
      model.slideNumber = updateOp.slide;
      pushCmd({method: 'sendSlide'});
      break;
    case 'getSlide':
      model.slideNumber = updateOp.slide;
      break;



    case 'NoOp': // yes, explicit NoOp!
      break; 
    default:
      throw 'update operation not defined';
  }
}

// --- View
// (model) -> vnode
// side effects: update operations
function view(m) {
  switch(m.page) {
    case 'presenter': return presenterView(m);
    case 'audience': return audienceView(m);
  }
}
const presenterView = (m) => 
  h('div.presenterPage', [
    h('div.slide', m.loadedSlides
      .map((s, i) => h('ul', {class: {active: i == m.slideNumber}}, 
        s.split('\n').map(s => h('li', s.trim()))
      ))),
    h('div.controls', [
      `Slide ${m.slideNumber + 1} of ${m.loadedSlides.length}`,
      h('button', 
        { on: {click: () => pushUpdate({method: 'prevSlide'})}
          , props: {disabled: m.slideNumber <= 0}
        }, '< Previous'),
      h('button', 
        { on: {click: () => pushUpdate({method: 'nextSlide'})} 
          , props: {disabled: m.slideNumber >= m.loadedSlides.length - 1}
        }, 'Next >'),
      switchPageButtonView(m),
      h('p', 'Try opening in another tab!')
    ])
  ]);

const audienceView = (m) => 
  h('div.audiencePage', [
    h('ul.slide', m.loadedSlides[m.slideNumber].split('\n')
      .map(s => s.trim(s))
      .map(s => h('li', s))),
    h('div.controls', [
      `Slide ${m.slideNumber + 1} of ${m.loadedSlides.length}`,
      h('button', 
        { on: {click: () => pushUpdate({method: 'prevSlide'})}
          , props: {disabled: m.slideNumber <= 0}
        }, '< Previous'),
      h('button', 
        { on: {click: () => pushUpdate({method: 'nextSlide'})} 
          , props: {disabled: m.slideNumber >= m.loadedSlides.length - 1}
        }, 'Next >'),
      switchPageButtonView(m)
    ])
  ]);

function switchPageButtonView(m) {
  let view = m.page === 'presenter' ? 'audience' : 'presenter';
  return h('button', 
    { on: {click: () => pushUpdate({method: 'setPage', page: view})} }, 
    view.charAt(0).toUpperCase() + view.slice(1) + ' View' );
}

// --- Subscriptions

//external commands 
window.addEventListener('storage', (e) => {
  if (e.key !== 'theslideguy') return;
  let cmd = JSON.parse(e.newValue);
  onExternalCmd(cmd);
});
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowRight':
      pushUpdate({method: 'nextSlide'});
      break;
    case 'ArrowLeft':
      pushUpdate({method: 'prevSlide'});
      break;
  }

  return true;
  e.preventDefault();
});

function onExternalCmd(cmd) {
  switch(cmd.method) {
    case 'setSlide': 
      if(typeof cmd.slide !== undefined) 
        pushUpdate({method: 'getSlide', slide: cmd.slide});
      break;
  }
}



// --- Command Reducer. The `cmd` argument's type is equivalent to Elm's 
// Using Optional lets us defer the error down. This is probably very 
// unnecessary, as far as I see it, but it's a cool experiment nontheless. 
//
// (cmd) -> Optional(UpdateOp)
function reduceCommand(cmd) {
  switch(cmd.method) {
    case 'sendSlide':
      localStorage.setItem('theslideguy', JSON.stringify({method: 'setSlide', slide: model.slideNumber}));
      break;
    default:
      return Optional(false);
  }
  return Optional({method: 'NoOp'});
}

// --- Wiring it all together

function pushUpdate(updateOp) {
  reduceUpdate(updateOp);
  render();
}

function pushCmd(cmdOp) {
  reduceCommand(cmdOp)
    .fold(update => pushUpdate, () => {throw 'method not found!'});
}

var oldVnode = document.getElementById('app');
function render() {
  const newVnode = view(model);
  oldVnode = patch(oldVnode, newVnode);
}

// initialize with localstorage data
init: {
  let loaded;
  try {
    const store = localStorage.getItem('theslideguy');
    if(!store) break init;

    loaded = JSON.parse(store);
    
    //validate the data
    loaded.slide = Util.constrainRange(0, model.loadedSlides.length - 1, loaded.slide);

    onExternalCmd(loaded);
  } catch(e) { console.error(e); console.error(loaded); }
}

/// ---

render();
