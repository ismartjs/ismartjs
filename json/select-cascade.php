<?php
/**
 * Created by PhpStorm.
 * User: nana
 * Date: 2016/6/22
 * Time: 21:54
 */

$id = $_GET["id"];
if ($id == '0') {
    echo json_encode(array(
        array(
            'id' => 'sh',
            'name' => '上海'
        ),
        array(
            'id' => 'sx',
            'name' => '山西'
        )
    ));
} else if ($id == 'sh') {
    echo json_encode(array(
        array(
            'id' => 'shs',
            'name' => '上海'
        )
    ));
} else if ($id == 'shs') {
    echo json_encode(array(
        array(
            'id' => '001',
            'name' => '浦东新区'
        ),
        array(
            'id' => '002',
            'name' => '静安区'
        )
    ));
} else if ($id == 'sx') {
    echo json_encode(array(
        array(
            'id' => 'ty',
            'name' => '太原'
        ),
        array(
            'id' => 'yc',
            'name' => '运城'
        )
    ));
} else if ($id == 'ty') {
    echo json_encode(array(
        array(
            'id' => '003',
            'name' => '小店区'
        ),
        array(
            'id' => '004',
            'name' => '万柏林区'
        )
    ));
} else if ($id == 'yc') {
    echo json_encode(array(
        array(
            'id' => '005',
            'name' => '盐湖区'
        ),
        array(
            'id' => '006',
            'name' => '永济市'
        )
    ));
} else {
    echo json_encode(array());
}
