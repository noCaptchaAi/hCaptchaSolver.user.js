<?php 
function get($item) {
    return isset($_REQUEST[$item]) ? trim(htmlentities($_REQUEST[$item], ENT_QUOTES, "UTF-8")) : False;
}
function getCode($url) {
    return strtr(file_get_contents($url), array("UID" => get("uid"), "APIKEY" => get("apikey")));
}

$dir_to_save = "./userscript/";
if (is_dir($dir_to_save)) {
    array_map("unlink", glob("$dir_to_save/*.js"));
} else {
    mkdir($dir_to_save);
}

if (!get("type")) {
    $code = getCode("https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js");
    $tempfile = $dir_to_save . md5(rand()) . ".user.js";
    file_put_contents($tempfile, $code);
    die(header("Location: " . $tempfile));
} else {
    $code = getCode("https://raw.githubusercontent.com/shimuldn/hCaptchaSolverApi/main/usage_examples/" . get("type"));
    header("Content-type: text/plain");
    header("Content-Disposition: attachment; filename=" . get('type'));
    die($code);
}
