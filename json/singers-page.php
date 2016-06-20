<?php
/**
 * Created by PhpStorm.
 * User: nana
 * Date: 2016/6/18
 * Time: 18:16
 */
$page = isset($_GET['page']) ? $_GET['page'] : 1;
$name = isset($_GET['name']) ? $_GET['name'] : null;
$results = array(
    array(
        'name' => '齐秦',
        'area' => "港台",
        'song' => '不让我的眼泪陪我过夜',
        'rank' => 1,
    ),
    array(
        'name' => '周杰伦',
        'area' => "港台",
        'song' => '爱在西元前',
        'rank' => 1,
    ),
    array(
        'name' => '梁静茹',
        'area' => "马来西亚",
        'song' => '宁夏',
        'rank' => 1,
    ),
    array(
        'name' => '刘惜君',
        'area' => "大陆",
        'song' => '恋风恋歌',
        'rank' => 1,
    ),
    array(
        'name' => '刘瑞琪',
        'area' => "大陆",
        'song' => '头号粉丝',
        'rank' => 1,
    ),
    array(
        'name' => '莫文蔚',
        'area' => "港台",
        'song' => '阴天',
        'rank' => 1,
    ),
    array(
        'name' => '齐秦',
        'area' => "港台",
        'song' => '不让我的眼泪陪我过夜',
        'rank' => 1,
    ),
    array(
        'name' => '周杰伦',
        'area' => "港台",
        'song' => '爱在西元前',
        'rank' => 1,
    ),
    array(
        'name' => '梁静茹',
        'area' => "马来西亚",
        'song' => '宁夏',
        'rank' => 1,
    ),
    array(
        'name' => '刘惜君',
        'area' => "大陆",
        'song' => '恋风恋歌',
        'rank' => 1,
    ),
    array(
        'name' => '刘瑞琪',
        'area' => "大陆",
        'song' => '头号粉丝',
        'rank' => 1,
    ),
    array(
        'name' => '莫文蔚',
        'area' => "港台",
        'song' => '阴天',
        'rank' => 1,
    )
);

function filterCallback($singer)
{
    return count(explode($_GET['name'], $singer['name'])) > 1;
}

if ($name) {
    $results = array_values(array_filter($results, 'filterCallback'));
}

$rs = array(
    'page' => $page,
    'pageSize' => 20,
    'total' => count($results),
    'results' => $results
);
echo json_encode($rs);