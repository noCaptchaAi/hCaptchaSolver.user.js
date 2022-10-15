<?php
function get($item) {
    return isset($_REQUEST[$item]) ? trim(htmlentities($_REQUEST[$item], ENT_QUOTES, "UTF-8")) : "";
}

$dir_to_save = "./userscript/";
if (is_dir($dir_to_save)) {
    array_map('unlink', glob("$dir_to_save/*.js"));
} else {
    mkdir($dir_to_save);
}

$string = file_get_contents("https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js");
$code = strtr($string, array("UID" => get('uid') or die, "APIKEY" => get('apikey') or die));

$tempfile = $dir_to_save . md5(rand()) . ".user.js";

file_put_contents($tempfile, $code);
echo "<script>window.location = \"$tempfile\";</script>";
