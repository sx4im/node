#include <node_api.h>
#include "../../js-native-api/common.h"

static int dummy;

// No-op finalizer. It never touches the environment.
static void Finalize(node_api_basic_env /* env */,
                     void* /* data */,
                     void* /* hint */) {}

// Attach the no-op finalizer to `object` via napi_wrap.
static napi_value Wrap(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value object;
  NODE_API_CALL(env, napi_get_cb_info(env, info, &argc, &object, NULL, NULL));
  NODE_API_CALL(env, napi_wrap(env, object, &dummy, Finalize, NULL, NULL));
  return NULL;
}

// Throws. The error is reported through `uncaughtException`.
static void CallJs(napi_env env,
                   napi_value /* js_callback */,
                   void* /* context */,
                   void* /* data */) {
  NODE_API_CALL_RETURN_VOID(
      env, napi_throw_error(env, NULL, "thrown from call_js_cb"));
}

// Invoke `CallJs` once through a threadsafe function.
static napi_value Start(napi_env env, napi_callback_info /* info */) {
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
                                                CallJs,
                                                &tsfn));
  NODE_API_CALL(
      env, napi_call_threadsafe_function(tsfn, NULL, napi_tsfn_blocking));
  NODE_API_CALL(
      env, napi_release_threadsafe_function(tsfn, napi_tsfn_release));
  return NULL;
}

// Module init
static napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
      DECLARE_NODE_API_PROPERTY("wrap", Wrap),
      DECLARE_NODE_API_PROPERTY("start", Start),
  };

  NODE_API_CALL(
      env,
      napi_define_properties(env,
                             exports,
                             sizeof(properties) / sizeof(properties[0]),
                             properties));

  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
