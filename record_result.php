<?php
$json = file_get_contents('php://input');
$obj = json_decode($json, true);
$server_data = ''; //enter server location here 
$path = $server_data."/".date("d-m-Y")."_".$obj["filename"];
if (substr(realpath(dirname($path)), 0, strlen($server_data))!=$server_data) {
    error_log("attempt to write to bad path: ".$path);
} else {
    $outfile = fopen($path, "a");
    fwrite(
        $outfile,
        sprintf($obj["filedata"])
    );
    fclose($outfile);
}
?>