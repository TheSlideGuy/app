
'use strict';
const patch = window.snabbdom.init([window.snabbdom_class.classModule, window.snabbdom_props.propsModule, window.snabbdom_style.styleModule, window.snabbdom_eventlisteners.eventListenersModule]);
const h = window.h.h;

// --- Model
const model = {
  pageNumber: 0, // 0 indexed!!
  loadedPages: 
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
    case 'nextPage':
      model.pageNumber++;
      break;
    case 'prevPage':
      model.pageNumber--;
      break;
    case 'setPage':
      model.pageNumber = updateOp.page;
      break;
    default:
      throw 'update operation not defined';
  }
}

// --- View
// (model) -> vnode
// side effects: update operations
function view(m) {
  return h('div', [
    h('ul', m.loadedPages[m.pageNumber].split('\n')
      .map(s => s.trim(s))
      .map(s => h('li', s))),
    h('hr'),
    h('div', [
      `Page ${m.pageNumber + 1} of ${m.loadedPages.length}`,
      m.pageNumber > 0
        ? h('button', { on: {click: () => pushUpdate({method: 'prevPage'})} }, '< Previous')
        : '',
      m.pageNumber < m.loadedPages.length - 1
        ? h('button', { on: {click: () => pushUpdate({method: 'nextPage'})} }, 'Next >')
        : '',
      h('p', 'Try opening in another tab!')
    ])
  ]);
}

// --- Subscriptions
// TODO: the way we pass operations is really suboptimal, 
//   since there's no guarantee that all of them will be consumed
window.addEventListener('storage', (e) => {
  if (e.key !== 'theslideguy') return;
  reduceUpdate(JSON.parse(e.newValue));
  render();
})


// --- Wiring it all together
function pushUpdate(updateOp) {
  reduceUpdate(updateOp);

  //perhaps this should be a "Command" in the Elm sense
  localStorage.setItem('theslideguy', JSON.stringify({method: 'setPage', page: model.pageNumber}));
  render();
}
var oldVnode = document.getElementById('app');
function render() {
  const newVnode = view(model);
  oldVnode = patch(oldVnode, newVnode);
}

// init with localstorage data?
try {
  reduceUpdate(JSON.parse(localStorage.getItem('theslideguy') || '{}'));
} catch(e) { console.error(e) }

render();

