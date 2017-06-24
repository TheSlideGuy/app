// --- Utility functions
(function(exports) {

   'use strict';
   //min and max are inclusive
   const constrainMax = function (max, n) {
      if(n > max) return max;
      return n;
   }
   const constrainMin = function (min, n) {
      if(n < min) return min;
      return n;
   }
   const constrainRange = function(min, max, n) {
     if (n > max) return max;
     if (n < min) return min;

     return n;
   }

   //define some handy functors
   const Box = (x) => ({
      map: f => Box(f(x)),
      fold: f => f(x),
   })

   //because Option is a DOM element, we have to use Optional. ARG!
   const Optional = (x) => ({
      map: f => x ? Optional(f(x)) : Optional(x),
      //or: f => x ? Optional(x) : Optional(f(x)),
      fold: (f, g) => x ? f(x) : g(x),
   })

   exports.Util = {constrainMax, constrainMin, constrainRange, Box, Optional};

   exports.Optional = Optional; //because globals rule!
})(window);
