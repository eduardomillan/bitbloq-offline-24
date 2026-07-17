'use strict';

/**
 * errorDialogs
 *
 * Diálogos modales para mensajes que requieren interacción explícita del
 * usuario (aceptar, cancelar, copiar texto). Sustituyen a los toasts
 * persistentes (alertsService.add sin timeout) que antes se quedaban en
 * pantalla hasta que el usuario pulsaba la X o un botón "Copiar".
 *
 * Ver MIGRATE_ARDUINO_CLI.md.
 */
angular.module('bitbloqOffline')
  .service('errorDialogs', function($rootScope, $translate, _, ngDialog, nodeClipboard) {

    var exports = {};

    /**
     * Muestra un diálogo de error/aviso.
     * @param {Object} opts
     *   titleKey   {string}  clave i18n del título
     *   messageKey {string}  clave i18n del mensaje (opcional si messageText)
     *   messageText{string}  texto literal del mensaje (tiene prioridad sobre messageKey)
     *   copyText   {string}  si se indica, se muestra un botón "Copiar" que copia este texto
     *   acceptKey  {string}  clave i18n del botón principal (def. 'error-dialog-accept')
     * @return {Object} referencia del diálogo ngDialog
     */
    exports.showErrorDialog = function(opts) {
        opts = opts || {};
        var modalScope = $rootScope.$new();

        var acceptAction = function() {
            modal.close();
        };

        var copyAction = function() {
            try {
                if (nodeClipboard && nodeClipboard.writeText && opts.copyText) {
                    nodeClipboard.writeText(opts.copyText);
                }
            } catch (e) {
                // clipboard puede no estar disponible en algunos contextos
            }
        };

        _.extend(modalScope, {
            title: opts.titleKey || 'error-dialog-title',
            messageKey: opts.messageKey,
            messageText: opts.messageText,
            hasCopy: !!opts.copyText,
            acceptButton: opts.acceptKey || 'error-dialog-accept',
            acceptAction: acceptAction,
            copyAction: copyAction
        });

        var modal = ngDialog.open({
            template: 'file://' + __dirname + '/views/modals/error-detail.html',
            className: 'modal--container modal--input',
            scope: modalScope,
            showClose: false
        });

        return modal;
    };

    return exports;
});
