<?php
add_action('graphql_register_types', function() {
    register_graphql_object_type('KpiRule', [
        'description' => 'A single KPI rule',
        'fields' => [
            'id' => [
                'type' => 'ID',
                'description' => 'The unique ID of the KPI rule',
            ],
            'time' => [
                'type' => 'Int',
                'description' => 'Time value of the KPI rule',
            ],
            'timeType' => [
                'type' => 'String',
                'description' => 'The time type (e.g., Minutes, Hours) for the KPI rule',
            ],
            'defaultPoints' => [
                'type' => 'Int',
                'description' => 'Default points for the KPI rule',
            ],
            'categoryId' => [
                'type' => 'Int',
                'description' => 'Category ID associated with the KPI rule',
            ],
            'tagId' => [
                'type' => 'Int',
                'description' => 'Tag ID associated with the KPI rule',
            ],
            'actionType' => [
                'type' => 'String',
                'description' => 'Action type of the KPI rule (e.g., Assign Tag, Assign Category)',
            ],
            'createdAt' => [
                'type' => 'String',
                'description' => 'Creation date of the KPI rule',
            ],
        ],
    ]);

    register_graphql_field('RootQuery', 'kpiRules', [
        'type' => ['list_of' => 'KpiRule'],
        'description' => 'Retrieve all KPI rules',
        'resolve' => function() {
            global $wpdb;
            $table_name = MAIL_INBOX_KPI_RULES_TABLE;
            $results = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);

            // Transform results to match GraphQL field names
            $kpiRules = array_map(function($rule) {
                return [
                    'id' => $rule['id'],
                    'time' => $rule['time'],
                    'timeType' => $rule['time_type'],
                    'defaultPoints' => $rule['default_points'],
                    'categoryId' => $rule['category_id'],
                    'tagId' => $rule['tag_id'],
                    'actionType' => $rule['action_type'],
                    'createdAt' => $rule['created_at'],
                ];
            }, $results);

            return $kpiRules;
        }
    ]);
});
