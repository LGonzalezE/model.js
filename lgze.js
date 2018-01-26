//------------------------------------------------------------Input------------------------------------------------------------//
+function ($) {
    "use strict";
    var Input = function (element, options) {
        this.$element = $(element);
        this.id = this.$element.attr('id');
        this.options = options;

    }
    Input.DEFAULTS = {
        datasource: { data: [] },
        datamember: 'data',
        valuemember: 'valuemember',
        displaymember: 'displaymember',
        item: { template: '<option value="{{valuemember}}">{{displaymember}}</option>' }
    }
    Input.prototype.datasource = function (value) {
        this.options.datasource = value;
        this.render();
    }

    Input.prototype.render = function () {

        var template = this.options.item.template;
        var items = '';
        var item = '';
        var datamember = this.options.datamember;
        var datarow = null;
        var rows_count = this.options.datasource == null ? 0 : this.options.datasource[datamember].length;


        if (rows_count > 0) {
            var columns = this.options.columns;
            for (var index = 0; index < rows_count; index++) {
                item = template;
                datarow = this.options.datasource[datamember][index];
                var valuemember = '{{' + this.options.valuemember + '}}';
                var displaymember = '{{' + this.options.displaymember + '}}';
                item = item.replace(new RegExp(valuemember, 'g'), datarow[this.options.valuemember]);
                item = item.replace(new RegExp(displaymember, 'g'), datarow[this.options.displaymember]);
                items += item;
            }

        }

        this.$element.html(items);

    }

    Input.prototype.post = function (args) {
        this.ajax({ url: args.url, data: args.data, method: 'POST' });
    }

    Input.prototype.ajax = function (args) {
        var url = args.url;
        var data = args.data;
        var method = args.method;

        this.options.exec = args.success;

        $.ajax({
            type: method,
            url: url,
            data: data,
            success: $.proxy(this.datasource, this),
            dataType: 'json'
        });
    }

    var old = $.fn.input; $.fn.input = function (option, args) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('lgze.input')
            var options = $.extend({}, Input.DEFAULTS, $this.data(), typeof option == 'object' && option)
            if (!data)
                $this.data('lgze.input', (data = new Input(this, options)));
            if (typeof option == 'string')
                data[option](args);
            else
                if (option.log) data.log();
        })
    }
    $.fn.input.Constructor = Input
    $.fn.input.noConflict = function () {
        $.fn.input = old;
        return this
    }
}(window.jQuery);


//------------------------------------------------------------Model------------------------------------------------------------//
+function ($) {
    "use strict";
    var Model = function (element, options) {
        this.$element = $(element);
        this.id = this.$element.attr('id');
        this.options = options;
        this.index = 0;
        this.init();

    }
    Model.DEFAULTS = {
        datasource: { data: [{ field: null }] },
        datamember: 'data',
        attribs: [{ name: "model", required: false, notnull: false, zerofill: false }],
        ondatasourcechange: function () { console.log('datasourcechange') },
        statusClass: { error: 'has-error', success: 'has-success', warning: 'has-warning' },
        validationMessages: {
            isrequired: 'Campo obligatorio.',
            isdate: 'Fecha no valida.',
            isalpha: 'Sólo letras.',
            isalphanumeric: 'Sólo letras y números.',
            isnumeric: 'Sólo números.',
            isemail: 'Email erróneo.',
            issuccess: '',
            outrange: 'Dato errado.',
            maxLength: 'El dato ingresado excede el límite de carácteres.',
            minLength: 'El dato ingresado no cumple con el mínimo de carácteres.'
        },
        statusAttribs: { status: 'sp_status', message: 'sp_message' }
    }

    Model.prototype.init = function () {


        var attrs = this.options.attribs;


        for (var index = 0; index < attrs.length; index++) {

            var attr = attrs[index];
            var prefix = this.id;
            var target = $("#" + prefix + "_" + attr.name);

            var isBind = this.isUndefined(attr.bind) ? 1 : attr.bind;
            if (!isBind) {
                //not binded attr
                continue;
            }

            if (target.length) {
                var data_field = $(target).attr("data-bind");
                var data_attr = $(target).attr("data-attr");

                if (this.isUndefined(data_attr) || this.isUndefined(data_field)) {
                    console.log('data-bind and data-attr is required for ' + target.attr('id'));
                    continue;
                }
                //status element
                var $container = $('#' + $(target).attr("id") + '_container');
                //message element
                var $message = $('#' + $(target).attr("id") + '_message');

                var maxLength = attr.hasOwnProperty('maxLength') ? attr.maxLength : 0;
                var minLength = attr.hasOwnProperty('minLength') ? attr.minLength : 0;

                if (maxLength !== 0) {
                    target.attr("maxlength", maxLength);
                }
                //input validation
                target.blur(function () {
                    var validate = $('#' + prefix).model('validate', $(this).attr("data-bind"));
                });
            }
        }
        return true;
    }

    Model.prototype.isUndefined = function (value) {
        return (typeof value == "undefined");
    }

    Model.prototype.isDate = function (value) {
        // date format DD/MM/YYYY
        var dateParts = value.split("/");
        var day = parseInt(dateParts[0]);
        var month = parseInt(dateParts[1]);
        var year = parseInt(dateParts[2]);
        var date = new Date(year, month, day);

        //var dateString = [dateParts[2], dateParts[1], dateParts[0]];

        //validate date format
        if (isNaN(date)) {
            return false;
        }

        return month > 0 && month < 13 && year > 0 && year < 32768 && day > 0 && day <= (new Date(year, month, 0)).getDate();
    }

    Model.prototype.isNumeric = function (value) {
        var regeX = /^\d+$/;
        return regeX.test(value);
    }

    Model.prototype.isAlpha = function (value) {
        var regeX = /^[a-zA-ZñÑáÁéÉíÍóÓúÚ]+$/;
        return regeX.test(value);
    }

    Model.prototype.isAlphaNumeric = function (value) {
        var regeX = /^([a-zA-Z0-9ñÑáÁéÉíÍóÓúÚ ]+)$/;
        return regeX.test(value);
    }

    Model.prototype.isEmail = function (value) {
        var regeX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regeX.test(value);
    }

    Model.prototype.attr = function (name) {

        var data = this.options.datasource[this.options.datamember];

        if (this.isUndefined(data)) {
            return 'warning';
        }

        var row = data[this.index];
        if (this.isUndefined(row)) {
            return 'warning';
        }

        var value = row[name];
        if (this.isUndefined(value))
            return 'warning';

        return value;

    }

    Model.prototype.attrMessage = function (message) {

        var attr = message.attr;
        var status = message.status;
        var statusClass = this.options.statusClass[status];
        var message = message.message;
        var container_id = this.id + '_' + attr + '_container';
        var message_id = this.id + '_' + attr + '_message';
        //status element
        var $container = $('#' + container_id);
        //message element
        var $message = $('#' + message_id);

        if ($message.length) {
            $message.html(message);
        }
        else {
            console.log("element not found:" + message_id);
        }

        if ($container.length) {
            $container.removeClass(this.options.statusClass.error);
            $container.removeClass(this.options.statusClass.success);
            $container.removeClass(this.options.statusClass.warning);
            $container.addClass(statusClass);
        }
        else {
            console.log("element not found:" + container_id);
        }
    }

    Model.prototype.status = function () {
        var data = this.options.datasource[this.options.datamember];

        if (this.isUndefined(data)) {
            return 'warning';
        }

        var row = data[this.index];
        if (this.isUndefined(row)) {
            return 'warning';
        }

        var status = row[this.options.statusAttribs.status];
        if (this.isUndefined(status))
            return 'warning';

        return status;
    }

    Model.prototype.message = function () {
        var data = this.options.datasource[this.options.datamember];

        if (this.isUndefined(data)) {
            return 'warning';
        }

        var row = data[this.index];
        if (this.isUndefined(row)) {
            return 'warning';
        }

        var message = row[this.options.statusAttribs.message];
        if (this.isUndefined(message))
            return 'warning';

        return message;
    }

    Model.prototype.datasource = function (value) {

        if (this.isUndefined(value)) {
            return this.options.datasource;
        }
        else {
            this.options.datasource = value;
            this.render();
            this.options.ondatasourcechange(value);
        }

    }

    Model.prototype.first = function () {
        this.index = 0;
        this.render();
        return true;
    }

    Model.prototype.last = function () {
        this.index = this.options.datasource[this.options.datamember].length - 1;
        this.render();
        return true;
    }

    Model.prototype.next = function () {

        if (this.index < this.options.datasource[this.options.datamember].length - 1) {
            this.index++;
            this.render();
            return true;
        }
        return false;
    }

    Model.prototype.previous = function () {

        if (this.index > 0) {
            this.index--;
            this.render();
            return true;
        }
        return false;
    }

    Model.prototype.clear = function () {

        var count = 0;
        var attrs = this.options.attribs;

        for (var index = 0; index < attrs.length; index++) {

            var attr = attrs[index];
            var prefix = this.id;
            var target = $("#" + prefix + "_" + attr.name);

            var isBind = this.isUndefined(attr.bind) ? 1 : attr.bind;

            if (!isBind) {
                //not binded attr
                continue;
            }

            if (target.length) {
                var data_field = $(target).attr("data-bind");
                var data_attr = $(target).attr("data-attr");
                var element_value = '';
                switch (data_attr) {
                    case "value": $(target).val(element_value); break;
                    case "html": $(target).html(element_value); break;
                    default: $(target).attr(data_attr, element_value); break;
                }
                count = count + 1;


                //status element
                var $status = $('#' + $(target).attr("data-status"));
                //message element
                var $message = $('#' + $(target).attr("data-message"));

                //success
                if ($status.length) {
                    $status.removeClass(this.options.statusClass.error);
                    $status.removeClass(this.options.statusClass.success);
                }

                if ($message.length)
                    $message.html('');

            }
            else {
                console.log("element for attrib " + attr.name + " not found");
            }

        }
    }

    Model.prototype.validate = function (name) {

        var validationErrors = 0;
        var validationSuccess = 0;
        var attrs = this.options.attribs;

        var attr;

        for (var index = 0; index < attrs.length; index++) {

            if (attrs[index].name === name)
                attr = attrs[index];
        }

        if (this.isUndefined(attr)) {
            return { result: 'danger', message: 'attrib not found:' + name };
        }
        var isBind = this.isUndefined(attr.bind) ? 1 : attr.bind;
        if (!isBind) {
            //not binded attr
            return { result: 'success', message: 'OK' };
        }

        var prefix = this.id;
        var target = $("#" + prefix + "_" + attr.name);


        if (target.length) {
            var data_field = $(target).attr("data-bind");
            var data_attr = $(target).attr("data-attr");

            if (this.isUndefined(data_attr) || this.isUndefined(data_field)) {
                console.log('data-bind and data-attr is required for ' + target.attr('id'));
                return { result: 'danger', message: 'data-bind and data-attr is required for ' + target.attr('id') };
            }

            //status element
            var $container = $('#' + $(target).attr("id") + '_container');
            //message element
            var $message = $('#' + $(target).attr("id") + '_message');

            var element_value;
            switch (data_attr) {
                case "value":
                    element_value = $(target).val();
                    break;
                case "html":
                    element_value = $(target).html();
                    break;
                default:
                    element_value = $(target).attr(data_attr);
                    break;
            }


            //input validation


            if (this.isUndefined(element_value) || element_value === null)
                element_value = '';

            //required validation

            var isRequired = this.isUndefined(attr.required) ? 0 : attr.required;
            var resultMessage = '';
            if (isRequired) {
                if (element_value === '' || element_value.length === 0) {
                    validationErrors++;
                    resultMessage += this.options.validationMessages.isrequired + ' ';

                    //return { result: validationErrors === 0 ? 'success' : 'danger', message: resultMessage, success: successCount, errors: errorsCount };
                }
                else {
                    validationSuccess++;
                }
            }

            if (!isRequired && (element_value === '' || element_value.length === 0)) {
                //skip validation
                console.log('skip validation for ' + attr.name);
            }
            else {
                //validate 
                var isDate = this.isUndefined(attr.isdate) ? 0 : attr.isdate;

                //isdate validation
                if (isDate) {
                    if (!this.isDate(element_value)) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.isdate + ' ';
                    }
                    else {
                        validationSuccess++;
                    }
                }

                var range = attr.hasOwnProperty('range') ? attr.range : { min: 0, max: 0 };

                var maxLength = attr.hasOwnProperty('maxLength') ? attr.maxLength : 0;
                var minLength = attr.hasOwnProperty('minLength') ? attr.minLength : 0;

                if (minLength !== 0) {
                    if (element_value.length < minLength) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.minLength + ' ';
                    }
                    else {
                        validationSuccess++;
                    }
                }

                if (maxLength !== 0) {
                    if (element_value.length > maxLength) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.maxLength + ' ';
                    }
                    else {
                        validationSuccess++;
                    }
                }

                //isnumeric validation
                var isNumeric = this.isUndefined(attr.isnumeric) ? 0 : attr.isnumeric;
                //var regeX = /^\d+$/;
                if (isNumeric) {
                    if (!this.isNumeric(element_value)) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.isnumeric + ' ';
                    }
                    else {
                        if (range.min !== 0 && range.max !== 0) {
                            if (!(element_value - 0 >= range.min && element_value - 0 <= range.max)) {
                                validationErrors++;
                                resultMessage += this.options.validationMessages.outrange + ' ';
                            }
                            else {
                                validationSuccess++;
                            }
                        }
                        else {
                            validationSuccess++;
                        }
                    }
                }

                //isalpha validation
                var isAlpha = this.isUndefined(attr.isalpha) ? 0 : attr.isalpha;
                //regeX = /^[a-zA-ZñÑáÁéÉíÍóÓúÚ]+$/;

                if (isAlpha) {
                    if (!this.isAlpha(element_value)) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.isalpha + ' ';
                    }
                    else {
                        validationSuccess++;
                    }
                }

                //isemail validation
                var isEmail = this.isUndefined(attr.isemail) ? 0 : attr.isemail;
                //regeX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (isEmail) {
                    if (!this.isEmail(element_value.toLowerCase())) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.isemail + ' ';
                    }
                    else {
                        validationSuccess++;
                    }
                }

                //isalphanumeric validation
                //regeX = /^([a-zA-Z0-9ñÑáÁéÉíÍóÓúÚ ]+)$/;
                var isAlphaNumeric = this.isUndefined(attr.isalphanumeric) ? 0 : attr.isalphanumeric;
                if (isAlphaNumeric) {
                    if (!this.isAlphaNumeric(element_value)) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.isalphanumeric + ' ';
                    }
                    else {
                        validationSuccess++;
                    }
                }
            }//validate


            if (validationErrors === 0) {
                //success
                
                this.attrMessage({ status: 'success', attr: attr.name, message: resultMessage });

            }
            else {
                //error
                this.attrMessage({ status: 'error', attr: attr.name, message: resultMessage });
            }


        }
        else {
            console.log("element for attrib " + attr.name + " not found");
        }

        return { result: validationErrors === 0 ? 'success' : 'danger', message: resultMessage, success: validationSuccess, errors: validationErrors };
    }

    Model.prototype.commit = function () {
        var errorsCount = 0;
        var successCount = 0;
        var row = this.options.datasource[this.options.datamember][this.index];

        var attrs = this.options.attribs;

        for (var index = 0; index < attrs.length; index++) {

            var attr = attrs[index];
            var prefix = this.id;
            var target = $("#" + prefix + "_" + attr.name);

            var isBind = this.isUndefined(attr.bind) ? 1 : attr.bind;

            if (!isBind) {
                //not binded attr
                continue;
            }



            if (target.length) {
                var data_field = $(target).attr("data-bind");
                var data_attr = $(target).attr("data-attr");

                if (this.isUndefined(data_attr) || this.isUndefined(data_field)) {
                    console.log('data-bind and data-attr is required for ' + target.attr('id'));
                    continue;
                }
                //status element
                var $container = $('#' + $(target).attr("id") + '_container');
                //message element
                var $message = $('#' + $(target).attr("id") + '_message');


                var element_value;
                switch (data_attr) {
                    case "value":
                        element_value = $(target).val();
                        break;
                    case "html":
                        element_value = $(target).html();
                        break;
                    default:
                        element_value = $(target).attr(data_attr);
                        break;
                }


                //input validation

                var validationErrors = 0;
                if (this.isUndefined(element_value) || element_value === null)
                    element_value = '';

                //required validation

                var isRequired = this.isUndefined(attr.required) ? 0 : attr.required;
                var resultMessage = '';
                if (isRequired) {
                    if (element_value === '' || element_value.length === 0) {
                        validationErrors++;
                        resultMessage += this.options.validationMessages.isrequired + ' ';
                    }
                }

                if (!isRequired && (element_value === '' || element_value.length === 0)) {
                    //skip validation
                    console.log('skip validation for ' + attr.name);
                }
                else {
                    //validate 
                    var isDate = this.isUndefined(attr.isdate) ? 0 : attr.isdate;

                    //isdate validation
                    if (isDate) {
                        if (!this.isDate(element_value)) {
                            validationErrors++;
                            resultMessage += this.options.validationMessages.isdate + ' ';
                        }
                    }

                    var range = attr.hasOwnProperty('range') ? attr.range : { min: 0, max: 0 };

                    var maxLength = attr.hasOwnProperty('maxLength') ? attr.maxLength : 0;
                    var minLength = attr.hasOwnProperty('minLength') ? attr.minLength : 0;

                    if (minLength !== 0) {
                        if (element_value.length < minLength) {
                            validationErrors++;
                            resultMessage += this.options.validationMessages.minLength + ' ';
                        }
                    }

                    if (maxLength !== 0) {
                        if (element_value.length > maxLength) {
                            validationErrors++;
                            resultMessage += this.options.validationMessages.maxLength + ' ';
                        }
                    }

                    //isnumeric validation
                    var isNumeric = this.isUndefined(attr.isnumeric) ? 0 : attr.isnumeric;
                    //var regeX = /^\d+$/;
                    if (isNumeric) {
                        if (!this.isNumeric(element_value)) {
                            validationErrors++;
                            resultMessage += this.options.validationMessages.isnumeric + ' ';
                        }
                        else {
                            if (range.min !== 0 && range.max !== 0) {
                                if (!(element_value - 0 >= range.min && element_value - 0 <= range.max)) {
                                    validationErrors++;
                                    resultMessage += this.options.validationMessages.outrange + ' ';
                                }
                            }
                        }
                    }

                    //isalpha validation
                    var isAlpha = this.isUndefined(attr.isalpha) ? 0 : attr.isalpha;
                    //regeX = /^[a-zA-ZñÑáÁéÉíÍóÓúÚ]+$/;

                    if (isAlpha) {
                        if (!this.isAlpha(element_value)) {
                            validationErrors++;
                            resultMessage += this.options.validationMessages.isalpha + ' ';
                        }
                    }

                    //isemail validation
                    var isEmail = this.isUndefined(attr.isemail) ? 0 : attr.isemail;
                    //regeX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    if (isEmail) {
                        if (!this.isEmail(element_value.toLowerCase())) {
                            validationErrors++;
                            resultMessage += this.options.validationMessages.isemail + ' ';
                        }
                    }

                    //isalphanumeric validation
                    //regeX = /^([a-zA-Z0-9ñÑáÁéÉíÍóÓúÚ ]+)$/;
                    var isAlphaNumeric = this.isUndefined(attr.isalphanumeric) ? 0 : attr.isalphanumeric;
                    if (isAlphaNumeric) {
                        if (!this.isAlphaNumeric(element_value)) {
                            validationErrors++;
                            resultMessage += this.options.validationMessages.isalphanumeric + ' ';
                        }
                    }
                }//validate


                if (validationErrors === 0) {
                    //success

                    this.attrMessage({ status: 'success', attr: attr.name, message: resultMessage });
                    //update field data
                    row[data_field] = element_value;
                    //count success updates
                    successCount++;
                }
                else {
                    this.attrMessage({ status: 'error', attr: attr.name, message: resultMessage });                   
                    errorsCount++;
                }

            }
            else {
                console.log("element for attrib " + attr.name + " not found");
            }

        }

        return errorsCount;
    }

    Model.prototype.render = function () {

        if (this.status !== 'success') {
            console.log(this.status() + ' : ' + this.message());
            return false;
        }

        this.clear();


        if (this.isUndefined(this.options.datasource)) {
            console.log('datasource is undefined');
            return false;
        }

        if (this.options.datasource.length === 0) {
            console.log('datasource is empty');
            return false;
        }

        if (this.isUndefined(this.options.datasource[this.options.datamember])) {
            console.log('datamember not found in datasource');
            return false;
        }

        if (!this.options.datasource.hasOwnProperty(this.options.datamember)) {
            console.log('datamember not found: ' + this.options.datamember);
            return false;
        }


        if (this.isUndefined(this.options.datasource[this.options.datamember].length === 0)) {
            console.log('rows is empty');
            return false;
        }


        var row = this.options.datasource[this.options.datamember][this.index];

        if (this.isUndefined(row)) {
            console.log('row is: undefined');
            return false;
        }
        var count = 0;
        var attrs = this.options.attribs;

        for (var index = 0; index < attrs.length; index++) {

            var attr = attrs[index];
            var prefix = this.id;
            var target = $("#" + prefix + "_" + attr.name);

            var isBind = this.isUndefined(attr.bind) ? 1 : attr.bind;

            if (!isBind) {
                //not binded attr
                continue;
            }

            if (target.length) {
                var data_field = $(target).attr("data-bind");
                var data_attr = $(target).attr("data-attr");
                var element_value = row[data_field];
                switch (data_attr) {
                    case "value": $(target).val(element_value); break;
                    case "html": $(target).html(element_value); break;
                    default: $(target).attr(data_attr, element_value); break;
                }
                count = count + 1;
            }
            else {
                console.log("element for attrib " + attr.name + " not found");
            }

        }
    }

    Model.prototype.post = function (args) {
        this.ajax({ url: args.url, data: args.data, method: 'POST' });
    }

    Model.prototype.ajax = function (args) {
        var url = args.url;
        var data = this.isUndefined(args.data) ? this.options.datasource[this.options.datamember][this.index] : args.data;
        var method = args.method;
        if (!this.isUndefined(args.ondatasourcechange))
            this.options.ondatasourcechange = args.ondatasourcechange;

        $.ajax({
            type: method,
            url: url,
            data: data,
            success: $.proxy(this.datasource, this),
            dataType: 'json'
        });
    }

    var old = $.fn.model; $.fn.model = function (option, args) {
        var $return = null;

        this.each(function () {
            var $this = $(this)
            var data = $this.data('lgze.model')

            var options = $.extend({}, Model.DEFAULTS, $this.data(), typeof option == 'object' && option)
            if (!data)
                $return = $this.data('lgze.model', (data = new Model(this, options)));
            if (typeof option == 'string')
                $return = data[option](args);
            else
                if (option.log)
                    $return = data.log();


        })

        return $return;
    }
    $.fn.model.Constructor = Model
    $.fn.model.noConflict = function () {
        $.fn.model = old;
        return this
    }
}(window.jQuery);