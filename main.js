'use strict';
const patch = window.snabbdom.init([window.snabbdom_class.classModule, window.snabbdom_props.propsModule, window.snabbdom_style.styleModule, window.snabbdom_eventlisteners.eventListenersModule]);
const h = window.h.h;
const thunk = window.snabbdom.thunk;


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
    ]
};

const getCompiled = R.memoize(textSlides => 
  textSlides.trim()
    .split('\n\n')
    .map(slide => slide.split('\n').map(s => s.trim()).join('\n')));
const getText = compiled => 
	compiled.join('\n\n');

// --- Update
// We really should be returning a tagged (Optional?) persistent data structure here
// returns whether or not we should rerender
// (Update) -> Boolean
function reduceUpdate(updateOp) {
  switch (updateOp.method) {

    case 'setPage':
      if (model.page === updateOp.page) return false;
      model.page = updateOp.page;
      break;
    
    case 'nextSlide': {
      const newSlide = Util.constrainMax(model.loadedSlides.length - 1, model.slideNumber + 1);
      if (model.slideNumber === newSlide) return false;
      model.slideNumber = newSlide;
      pushCmd({method: 'sendSlide'});
      break; }
    case 'prevSlide': {
      const newSlide = Util.constrainMin(0, model.slideNumber - 1);
      if (model.slideNumber === newSlide) return false;
      model.slideNumber = newSlide;
      pushCmd({method: 'sendSlide'});
      break; }
    case 'setSlide':
      if (model.slideNumber === updateOp.slide) return false;

      model.slideNumber = updateOp.slide;
      pushCmd({method: 'sendSlide'});
      break;
    case 'getSlide':
      if (model.slideNumber === updateOp.slide) return false;

      model.slideNumber = updateOp.slide;
      break;

    case 'setSlides': 
      console.log('set slides');
      model.loadedSlides = updateOp.slides; 
      pushCmd({method: 'sendSlides'});
      break;
    case 'getSlides': 
      model.loadedSlides = updateOp.slides; 
      break;

    case 'NoOp': // yes, explicit NoOp!
      return false;
    default:
      throw 'update operation not defined';
  }

  return true;
}

// --- View
// (model) -> vnode
// side effects: update operations
function view(m) {
  console.log('Rendering!');
  switch(m.page) {
    case 'presenter': return presenterView(m);
    case 'audience': return audienceView(m);
    case 'editor': return editorView(m);
  }
}
const presenterView = (m) => 
  h('div.presenterPage', [
    h('div.slide', m.loadedSlides
      .map((s, i) => h('ul', {class: {active: i == m.slideNumber}}, 
        s.split('\n').map(s => h('li', 
          {on: {click: () => pushUpdate({method: 'setSlide', slide: i})}}, 
        s.trim()))
      ))),
    h('div.controls', [
      `Slide ${m.slideNumber + 1} of ${m.loadedSlides.length}`,
      h('a.button', 
        { on: {click: () => pushUpdate({method: 'prevSlide'})}
          , props: {disabled: m.slideNumber <= 0}
        }, '< Previous'),
      h('a.button', 
        { on: {click: () => pushUpdate({method: 'nextSlide'})} 
          , props: {disabled: m.slideNumber >= m.loadedSlides.length - 1}
        }, 'Next >'),
      switchPageButtonView(m.page),
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
      h('a.button', 
        { on: {click: () => pushUpdate({method: 'prevSlide'})}
          , props: {disabled: m.slideNumber <= 0}
        }, '< Previous'),
      h('a.button', 
        { on: {click: () => pushUpdate({method: 'nextSlide'})} 
          , props: {disabled: m.slideNumber >= m.loadedSlides.length - 1}
        }, 'Next >'),
      switchPageButtonView(m.page)
    ])
  ]);

const editorView = (m) => 
  h('div.editorPage', [
    h('h1', 'Edit'),
    h('h2', 'Preview'),
    h('div.slide', m.loadedSlides
      .map((s, i) => h('ul', {class: {active: i == m.slideNumber}}, 
        s.split('\n').map(s => h('li', s.trim()))
      ))),
    thunk('textarea', () => 
      h('textarea', {
        on: {input: (e) => pushUpdate({method: 'setSlides', slides: getCompiled(e.target.value)})}
        }, getText(m.loadedSlides))
    , [m.page]),
    h('div.footer', [switchPageButtonView(m.page)])
  ]);


function switchPageButtonView(page) {
  return h('span.switchPageButton.c-input-group', ['presenter', 'audience', 'editor'].map(view => 
      h('a.c-button.c-button--ghost-brand', 
        {
          props: {href: '#' + view},
          class: {'c-button--active': page === view}
        },
        view.charAt(0).toUpperCase() + view.slice(1) + ' View' )
    ));
}

// --- Subscriptions

//external commands 
window.addEventListener('storage', (e) => {
  if (e.key !== 'theslideguy' && e.key !== 'theslideguy-slides') return;
  let cmd = JSON.parse(e.newValue);
  onExternalCmd(cmd);
});
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      pushUpdate({method: 'nextSlide'});
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
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
    case 'setSlides': 
      if(typeof cmd.slides !== undefined) 
        pushUpdate({method: 'getSlides', slides: cmd.slides});
      break;
  }
}

window.addEventListener('hashchange', onHashChange, false);
onHashChange();
function onHashChange() {
  let hash = location.hash.slice(1, location.hash.length);
  switch(hash) {
    case 'presenter':
    case 'audience':
    case 'editor':
      pushUpdate({method: 'setPage', page: hash});
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
    case 'sendSlides':
      localStorage.setItem('theslideguy-slides', 
        JSON.stringify({method: 'setSlides', slides: model.loadedSlides}));
      break;
    default:
      return Optional(false);
  }
  return Optional({method: 'NoOp'});
}

// --- Wiring it all together

function pushUpdate(updateOp) {
  reduceUpdate(updateOp) && oldVnode && render();
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
['theslideguy', 'theslideguy-slides'].forEach((key) => {
  let loaded;
  try {
    const store = localStorage.getItem(key);
    if(!store) return;

    loaded = JSON.parse(store);

    onExternalCmd(loaded);
  } catch(e) { console.error(e); console.error(loaded); }
});

/// ---

render();
