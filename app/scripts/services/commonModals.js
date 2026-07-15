'use strict';

/**
 * @ngdoc service
 * @name bitbloqOffline.commonModals
 * @description
 * # commonModals
 * Service in the bitbloqOffline.
 */
angular.module('bitbloqOffline')
  .service('commonModals', function($rootScope, $translate, _, ngDialog, common) {

    var exports = {};

    exports.launchNotSavedModal = function(callback) {
      var confirmAction = function() {
          notSavedModal.close();
          callback(0);
        },
        rejectAction = function() {
          notSavedModal.close();
          callback(-1);
        },
        closeAction = function(){
          notSavedModal.close();
          callback(1);
        };

      var modalOptions = $rootScope.$new();
      _.extend(modalOptions, {
        title: 'save',
        confirmButton: 'modal-exit-save',
        rejectButton: 'modal-exit-exit',
        confirmAction: confirmAction,
        rejectAction: rejectAction,
        closeAction: closeAction,
        contentTemplate: 'file://' + __dirname + '/views/modals/text.html',
        modalButtons: true,
        save: true
      });

      var notSavedModal = ngDialog.open({
        template: 'file://' + __dirname + '/views/modals/modal.html',
        className: 'modal--container modal--input',
        scope: modalOptions,
        showClose: false
      });
    };

    exports.launchChangeLanguageModal = function() {
        var oldLanguage = $translate.use();

        var confirmAction = function() {
                languageModal.close();
                $translate.use(modalOptions.lang);
            },
            translateLanguage = function(language) {
                common.translateTo(language);
            },
            rejectAction = function() {
                common.translateTo(oldLanguage);
            },
            languageModal,
            modalOptions = $rootScope.$new();

        _.extend(modalOptions, {
            title: 'header-change-language',
            confirmButton: 'change-language',
            rejectButton: 'modal-button-cancel',
            confirmAction: confirmAction,
            rejectAction: rejectAction,
            contentTemplate: 'file://' + __dirname + '/views/modals/input.html',
            modalButtons: true,
            modalCommonDropdown: true,
            headingOptions: $translate.use(),
            modaloptions: ['bg-BG','ca-ES','de-DE','en-GB','es-ES','eu-ES','fr-FR','gl','it-IT','nl-NL','pt-PT','ru-RU','zh-CN'],
            optionsClick: translateLanguage,
            dropdown: {
                options: 'languages',
                dataElement: 'languages-dropdown-button'
            },
            translate: function(language) {
                modalOptions.lang = language;
            },
            condition: function() {
                return true;
            }
        });

        languageModal = ngDialog.open({
            template: 'file://' + __dirname + '/views/modals/modal.html',
            className: 'modal--container modal--input',
            scope: modalOptions,
            showClose: false
        });
    };

    return exports;
  });
