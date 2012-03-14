ig.module(
    'plugins.string-utils'
)
    .requires(
)
    .defines(function(){

        /**
         *
         * @param length
         * @return {*}
         */
        String.prototype.padString = function (length) {
            var str = this;
            while (str.length < length) {
                str = '0' + str;
            }
            return str;
        }

    }
)