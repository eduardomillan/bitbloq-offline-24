'use strict';

/**
 * @ngdoc service
 * @name bitbloqOffline.web2boardLocator
 * @description
 * # web2boardLocator
 * Shared helper that resolves the Web2Board launcher path from a candidate
 * entry (a folder, a `web2board` subfolder, or the launcher file directly),
 * with a depth-limited recursive fallback for non-standard nested installs.
 * Used both by the `web2board` factory (auto-detection) and by the settings
 * modal validation, so both agree on what counts as "valid".
 */
angular.module('bitbloqOffline')
    .factory('web2boardLocator', function () {

        var WEB2BOARD_LAUNCHER = process.platform === 'win32' ? 'web2boardLauncher.exe' : 'web2boardLauncher',
            WEB2BOARD_BINARY = process.platform === 'win32' ? 'web2board.exe' : 'web2board',
            MAX_SEARCH_DEPTH = 3;

        function launcherName() {
            return WEB2BOARD_LAUNCHER;
        }

        function findLauncherRecursive(dir, depth) {
            var fs = require('fs'),
                path = require('path');
            if (depth > MAX_SEARCH_DEPTH) {
                return null;
            }
            var entries;
            try {
                entries = fs.readdirSync(dir);
            } catch (e) {
                return null;
            }
            var subDirs = [];
            for (var i = 0; i < entries.length; i++) {
                var full = path.join(dir, entries[i]);
                if ((entries[i] === WEB2BOARD_LAUNCHER || entries[i] === WEB2BOARD_BINARY) && fs.existsSync(full)) {
                    return full;
                }
                try {
                    if (fs.statSync(full).isDirectory()) {
                        subDirs.push(full);
                    }
                } catch (e) {
                    // ignore unreadable entries
                }
            }
            for (var j = 0; j < subDirs.length; j++) {
                var found = findLauncherRecursive(subDirs[j], depth + 1);
                if (found) {
                    return found;
                }
            }
            return null;
        }

        /**
         * Resolve a candidate to a launcher path, or null if not found.
         * @param {string} candidate folder, `web2board` subfolder, or launcher file
         */
        function resolve(candidate) {
            var fs = require('fs'),
                path = require('path');
            if (!candidate) {
                return null;
            }
            // Direct launcher (web2boardLauncher or web2board binary).
            var basename = path.basename(candidate);
            if (basename === WEB2BOARD_LAUNCHER || basename === WEB2BOARD_BINARY) {
                // If the candidate is a file (not a directory), return it directly.
                // If it is a directory whose name happens to match, fall through to
                // directory resolution so we look inside for the actual binary.
                if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
                    return candidate;
                }
            }
            if (!fs.existsSync(candidate)) {
                return null;
            }
            if (!fs.statSync(candidate).isDirectory()) {
                return null;
            }
            // <candidate>/web2boardLauncher
            var direct = path.join(candidate, WEB2BOARD_LAUNCHER);
            if (fs.existsSync(direct)) {
                return direct;
            }
            // <candidate>/web2board
            direct = path.join(candidate, WEB2BOARD_BINARY);
            if (fs.existsSync(direct)) {
                return direct;
            }
            // <candidate>/web2board/web2boardLauncher
            var nested = path.join(candidate, 'web2board', WEB2BOARD_LAUNCHER);
            if (fs.existsSync(nested)) {
                return nested;
            }
            // <candidate>/web2board/web2board
            nested = path.join(candidate, 'web2board', WEB2BOARD_BINARY);
            if (fs.existsSync(nested)) {
                return nested;
            }
            return findLauncherRecursive(candidate, 0);
        }

        /**
         * Whether the candidate contains a usable Web2Board launcher.
         * An empty candidate is considered valid (means "auto-detect").
         */
        function isValid(candidate) {
            if (!candidate || !candidate.trim()) {
                return true;
            }
            return !!resolve(candidate.trim());
        }

        return {
            launcherName: launcherName,
            resolve: resolve,
            isValid: isValid
        };
    });
