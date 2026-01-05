"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_lib_activity-logger_ts";
exports.ids = ["_rsc_lib_activity-logger_ts"];
exports.modules = {

/***/ "(rsc)/./lib/activity-logger.ts":
/*!********************************!*\
  !*** ./lib/activity-logger.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   logAdminActivity: () => (/* binding */ logAdminActivity)\n/* harmony export */ });\n/* harmony import */ var _db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./db */ \"(rsc)/./lib/db.ts\");\n// Utility function to log admin activities\n\nasync function logAdminActivity(adminId, actionType, actionDescription, entityType, entityId, ipAddress) {\n    try {\n        const connection = await _db__WEBPACK_IMPORTED_MODULE_0__[\"default\"].getConnection();\n        try {\n            await connection.execute(`INSERT INTO admin_activity_logs \r\n                (admin_id, action_type, action_description, entity_type, entity_id, ip_address, created_at) \r\n                VALUES (?, ?, ?, ?, ?, ?, NOW())`, [\n                adminId,\n                actionType,\n                actionDescription,\n                entityType || null,\n                entityId || null,\n                ipAddress || null\n            ]);\n        } finally{\n            connection.release();\n        }\n    } catch (error) {\n        console.error(\"Failed to log activity:\", error);\n    // Don't throw - logging failures shouldn't break the main operation\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYWN0aXZpdHktbG9nZ2VyLnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkNBQTJDO0FBQ25CO0FBRWpCLGVBQWVDLGlCQUNsQkMsT0FBZSxFQUNmQyxVQUFrQixFQUNsQkMsaUJBQXlCLEVBQ3pCQyxVQUFtQixFQUNuQkMsUUFBaUIsRUFDakJDLFNBQWtCO0lBRWxCLElBQUk7UUFDQSxNQUFNQyxhQUFhLE1BQU1SLDJDQUFJQSxDQUFDUyxhQUFhO1FBRTNDLElBQUk7WUFDQSxNQUFNRCxXQUFXRSxPQUFPLENBQ3BCLENBQUM7O2dEQUUrQixDQUFDLEVBQ2pDO2dCQUFDUjtnQkFBU0M7Z0JBQVlDO2dCQUFtQkMsY0FBYztnQkFBTUMsWUFBWTtnQkFBTUMsYUFBYTthQUFLO1FBRXpHLFNBQVU7WUFDTkMsV0FBV0csT0FBTztRQUN0QjtJQUNKLEVBQUUsT0FBT0MsT0FBTztRQUNaQyxRQUFRRCxLQUFLLENBQUMsMkJBQTJCQTtJQUN6QyxvRUFBb0U7SUFDeEU7QUFDSiIsInNvdXJjZXMiOlsid2VicGFjazovL25ld3llYXJscC8uL2xpYi9hY3Rpdml0eS1sb2dnZXIudHM/MjlkYyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBVdGlsaXR5IGZ1bmN0aW9uIHRvIGxvZyBhZG1pbiBhY3Rpdml0aWVzXHJcbmltcG9ydCBwb29sIGZyb20gJy4vZGInO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ0FkbWluQWN0aXZpdHkoXHJcbiAgICBhZG1pbklkOiBudW1iZXIsXHJcbiAgICBhY3Rpb25UeXBlOiBzdHJpbmcsXHJcbiAgICBhY3Rpb25EZXNjcmlwdGlvbjogc3RyaW5nLFxyXG4gICAgZW50aXR5VHlwZT86IHN0cmluZyxcclxuICAgIGVudGl0eUlkPzogbnVtYmVyLFxyXG4gICAgaXBBZGRyZXNzPzogc3RyaW5nXHJcbikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgcG9vbC5nZXRDb25uZWN0aW9uKCk7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uZXhlY3V0ZShcclxuICAgICAgICAgICAgICAgIGBJTlNFUlQgSU5UTyBhZG1pbl9hY3Rpdml0eV9sb2dzIFxyXG4gICAgICAgICAgICAgICAgKGFkbWluX2lkLCBhY3Rpb25fdHlwZSwgYWN0aW9uX2Rlc2NyaXB0aW9uLCBlbnRpdHlfdHlwZSwgZW50aXR5X2lkLCBpcF9hZGRyZXNzLCBjcmVhdGVkX2F0KSBcclxuICAgICAgICAgICAgICAgIFZBTFVFUyAoPywgPywgPywgPywgPywgPywgTk9XKCkpYCxcclxuICAgICAgICAgICAgICAgIFthZG1pbklkLCBhY3Rpb25UeXBlLCBhY3Rpb25EZXNjcmlwdGlvbiwgZW50aXR5VHlwZSB8fCBudWxsLCBlbnRpdHlJZCB8fCBudWxsLCBpcEFkZHJlc3MgfHwgbnVsbF1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2cgYWN0aXZpdHk6JywgZXJyb3IpO1xyXG4gICAgICAgIC8vIERvbid0IHRocm93IC0gbG9nZ2luZyBmYWlsdXJlcyBzaG91bGRuJ3QgYnJlYWsgdGhlIG1haW4gb3BlcmF0aW9uXHJcbiAgICB9XHJcbn1cclxuIl0sIm5hbWVzIjpbInBvb2wiLCJsb2dBZG1pbkFjdGl2aXR5IiwiYWRtaW5JZCIsImFjdGlvblR5cGUiLCJhY3Rpb25EZXNjcmlwdGlvbiIsImVudGl0eVR5cGUiLCJlbnRpdHlJZCIsImlwQWRkcmVzcyIsImNvbm5lY3Rpb24iLCJnZXRDb25uZWN0aW9uIiwiZXhlY3V0ZSIsInJlbGVhc2UiLCJlcnJvciIsImNvbnNvbGUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/activity-logger.ts\n");

/***/ })

};
;