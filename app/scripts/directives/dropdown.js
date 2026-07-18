angular.module('bitbloqOffline')
  .directive('dropdown', function($parse, $timeout, $filter, $translate) {
    return {
      restrict: 'E',
      templateUrl: 'file://' + __dirname + '/views/components/dropdown.html',
      scope: {
        optionsClick: '=',
        tree: '='
      },
      controllerAs: 'dropdown',
      controller: function($scope, $element, $attrs, common) {
        var self = this;
        var mainContent;
        self.activeMenu = null;

        self.select = function(menu) {
          if (self.activeMenu === menu) {
            self.activeMenu = null;
          } else {
            self.activeMenu = menu;
          }
        };

        self.changeTitle = function(item) {
          if ($scope.tree.languages) {
            translate = $filter('translate');
            $scope.tree.languages.name = translate(item.name);
            common.translateTo(item.name);
          }
        };

        self.closeDropdown = function() {
          $timeout(function() {
            self.activeMenu = null;
          }, 0);
        };

        // Convierte un accelerator de Electron (p.ej. 'CommandOrControl+S') en
        // texto legible para mostrar junto a la entrada del menú ('Ctrl+S').
        self.formatAccelerator = function(accelerator) {
            if (!accelerator) {
                return '';
            }
            var isMac = process.platform === 'darwin';
            return accelerator
                .replace(/CommandOrControl/g, isMac ? 'Cmd' : 'Ctrl')
                .replace(/Control/g, 'Ctrl')
                .replace(/Command/g, 'Cmd')
                .replace(/Plus/g, '+')
                .replace(/Shift/g, isMac ? '⇧' : 'Shift')
                .replace(/Alt/g, isMac ? '⌥' : 'Alt');
        };

        $(document).on('click', function() {
          if ($(event.target).closest('dropdown').length > 0) {
            return false;
          }
          self.closeDropdown();
        });
      }
    };
  });