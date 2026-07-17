'use strict';

/**
 * @ngdoc service
 * @name bitbloqOffline.commonModals
 * @description
 * # commonModals
 * Service in the bitbloqOffline.
 */
angular.module('bitbloqOffline')
  .service('commonModals', function($rootScope, $translate, _, ngDialog, common, nodeDialog, nodeFs, web2boardLocator) {

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

    exports.launchWeb2BoardSettingsModal = function() {
        var scope = $rootScope.$new();
        scope.path = (common.settings && common.settings.web2boardPath) || '';
        scope.error = '';

        scope.browse = function() {
            var selection = nodeDialog.showOpenDialog({
                properties: ['openFile', 'openDirectory']
            });
            if (selection) {
                scope.path = selection[0];
                scope.error = '';
            }
        };

        scope.cancel = function() {
            modal.close();
        };

        scope.save = function() {
            var value = (scope.path || '').trim();
            // Reuse the same detection logic as the runtime so the dialog accepts
            // any location the app would actually be able to launch (including
            // depth-limited nested installs). An empty path means auto-detect.
            if (!web2boardLocator.isValid(value)) {
                scope.error = $translate.instant('web2board-settings-invalid');
                return;
            }
            common.settings.web2boardPath = value;
            common.saveSettings();
            modal.close();
        };

        var modal = ngDialog.open({
            template: 'file://' + __dirname + '/views/modals/web2board-settings.html',
            className: 'modal--container modal--input',
            scope: scope,
            showClose: true
        });
    };

    return exports;
  });
