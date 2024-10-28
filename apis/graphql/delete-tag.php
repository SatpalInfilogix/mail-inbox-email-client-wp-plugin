<?php
add_action('graphql_register_types', function() {
    register_graphql_mutation('deleteTagById', [
        'inputFields' => [
            'id' => ['type' => 'ID'],
        ],
        'outputFields' => [
            'success' => ['type' => 'Boolean']
        ],
        'mutateAndGetPayload' => function($input) {
            global $wpdb;
            $id = absint($input['id']);

            $deleted = $wpdb->delete(MAIL_INBOX_TAGS_TABLE, ['id' => $id]);

            return ['success' => (bool) $deleted];
        }
    ]);
});
