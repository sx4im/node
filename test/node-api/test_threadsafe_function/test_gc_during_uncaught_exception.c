#define NAPI_EXPERIMENTAL
#define NODE_API_EXPERIMENTAL_NO_WARNING
#include <node_api.h>
#include "../../js-native-api/common.h"

static int dummy;

// Does nothing at all. It never touches the environment.
static void finalize(node_api_basic_env env, void* data, void* hint) {}

// wrap(object): attach the no-op finalizer to `object`.
static napi_value wrap(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value object;
  NODE_API_CALL(env, napi_get_cb_info(env, info, &argc, &object, NULL, NULL));
  NODE_API_CALL(env, napi_wrap(env, object, &dummy, finalize, NULL, NULL));
  return NULL;
}

// Throws. The documentation says this is reported through
// `uncaughtException`.
static void call_js(napi_env env,
                    napi_value js_callback,
                    void* context,
                    void* data) {
  NODE_API_CALL_RETURN_VOID(
      env, napi_throw_error(env, NULL, "thrown from call_js_cb"));
}

// start(): invoke `call_js` once through a threadsafe function.
static napi_value start(napi_env env, napi_callback_info info) {
  napi_value name;
  NODE_API_CALL(
      env, napi_create_string_utf8(env, "repro", NAPI_AUTO_LENGTH, &name));
  napi_threadsafe_function tsfn;
  NODE_API_CALL(env,
                napi_create_threadsafe_function(env,
                                                NULL,
                                                NULL,
                                                name,
                                                0,
                                                1,
                                                NULL,
                                                NULL,
                                                NULL,
                                                call_js,
                                                &tsfn));
  NODE_API_CALL(
      env, napi_call_threadsafe_function(tsfn, NULL, napi_tsfn_blocking));
  NODE_API_CALL(
      env, napi_release_threadsafe_function(tsfn, napi_tsfn_release));
  return NULL;
}

static napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
      DECLARE_NODE_API_PROPERTY("wrap", wrap),
      DECLARE_NODE_API_PROPERTY("start", start),
  };

  NODE_API_CALL(env,
                napi_define_properties(
                    env,
                    exports,
                    sizeof(properties) / sizeof(properties[0]),
                    properties));

  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
