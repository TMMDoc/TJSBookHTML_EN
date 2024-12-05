var searchBox, searchResult;
function sLoaded () {
   document.querySelectorAll('button.tree').forEach(btn => {
      if (btn.classList.contains("open") || btn.classList.contains("closed"))
         btn.onclick = function () { sNavToggle(this) };
   });
   searchBox = document.getElementById("searchinput");
   searchResult = document.getElementById("results");
   searchBox.focus();
   document.onkeyup = evt => {
      evt || window.event;
      node = null;
      // Shortcut: F
      if (document.activeElement != searchBox && evt.key == "f") {
         searchBox.focus();
         return;
      }
      // Ignore left/right if search box is not empty and it has the focus 
      if (!(searchBox.value.length && document.activeElement == searchBox)) {
         if (evt.key == "ArrowRight") node = document.querySelector(".pagination .next");
         if (evt.key == "ArrowLeft") node = document.querySelector(".pagination .prev");
      }
      if (searchResult.childNodes.length && evt.key == "ArrowUp" || evt.key == "ArrowDown" || evt.key == "Escape") navigateResults(evt);
      if (node != null) window.location = node.firstChild.getAttribute("href");
   }
   // Setup lunr search
   lunrIndex = lunr.Index.load(indexJSON);
   initSearch();
}

function sNavToggle (btn) {
  ul = btn;
  for (let i = 0; i < 10; i++) {
    ul = ul.nextSibling;
    if (ul.nodeName == "UL") break;
  }
  if (btn.classList.contains ("open")) {
    btn.classList.replace ("open", "closed");
    ul.classList.add ("hide");
  } else {
    btn.classList.replace ("closed", "open");
    ul.classList.remove ("hide");
  }  
}

// Search interface ---
function initSearch () {
   searchBox.onkeydown = (e) => {
      var scrollOffset = 0;
      // Use up/down arrows for the article scrolling.
      if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {         
         scrollOffset = e.key == 'ArrowUp' ? -50 : 50;
      } else if (e.key == 'PageUp' || e.key == 'PageDown') {
         scrollOffset = e.key == 'PageUp' ? -500 : 500;
      }

      if (scrollOffset != 0) {
         if (searchBox.value.length || searchResult.childNodes.length) return;
         var article = document.getElementById("article");
         article.scrollBy(0, scrollOffset);
         e.preventDefault();
      }
   };

   searchBox.onkeyup = (e) => {
      // Up/down keys are used in list navigation.
      if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {
         e.preventDefault();
         return;
      }
      var ul = searchResult;
      ul.innerHTML = "";
      const term = searchBox.value;
      if (!term || term.length < 2) return;
      // First try the exact match.
      var res = lunrIndex.search(term);
      const regex = /\+|\*|~|-/gm;
      // If no result is found, and the text doesn't already use modifiers, 
      // apply the fuzzy search.
      if (!res.length && !regex.exec(term)) {
         res = lunrIndex.search(term + "*");
         if (!res.length)
            res = lunrIndex.search(term + "~1");
      }
      showResults(res);
   };
}

function showResults (results) {
   if (!results.length) return;
   var files = filesJSON.files;
   var ul = searchResult;
   // Only show the first ten results
   results.slice(0, 10).forEach(result => {
      var file = files[result.ref];
      var li = document.createElement("li"); ul.appendChild(li);
      var a = document.createElement("a"); li.appendChild(a);
      a.href = baseLevel + file.url + ".html";
      a.text = file.lbl;
   });
}

// We implement the circular navigation where the focus cycles between the search box
// and the search results. List item in focus is displayed with a light-blue color.
// 1. Focus to first/last item if search has the focus and Down/Up arrow was pressed.
// 2. Then focus to next/previous sibling on Down/Up keys.
// 3. Focus back to search box if Down/Up key is pressed while last/first item has focus.
// 4. Collapse results and focus back to search on 'Escape' key press.
// 5. Navigate to the selected page on 'Enter' keypress. (This is an implicit anchor item behavior.)
function navigateResults (e) {
   var ul = searchResult;
   if (!ul.childNodes.length) return;
   var first = ul.firstChild, last = ul.lastChild
   var active = document.activeElement;
   var li = active.parentNode.parentNode == ul ? active.parentNode : null;
   switch (e.key) {
      case 'Escape':
         if (!li) return;
         // We are here because Escape was pressed during the result navigation.
         // Collapse the list and switch the focus back to search.
         ul.innerHTML = "";
         searchBox.focus();
         e.preventDefault();
         break;
      case 'ArrowUp':
         if (searchBox == active) last.firstChild.focus();
         else if (li) {
            if (li.previousSibling) li.previousSibling.firstChild.focus();
            else searchBox.focus();
         }
         break;
      case 'ArrowDown':
         if (searchBox == active) first.firstChild.focus();
         else if (li) {
            if (li.nextSibling) li.nextSibling.firstChild.focus();
            else searchBox.focus();
         }
         break;
   }
}
// ---