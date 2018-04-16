export const postTeamSchema = {
  'type': 'object',
  'title': 'Root schema.',
  'description': 'An explanation about the purpose of this instance.',
  'properties': {
    'name': {
      'type': 'string',
      'title': 'Team name.',
      'description': 'An explanation about the purpose of this instance.',
    },
    'password': {
      'type': 'string',
      'title': 'Team password.',
      'description': 'An explanation about the purpose of this instance.',
    },
    'members': {
      'type': 'array',
      'title': 'Members schema.',
      'description': 'An explanation about the purpose of this instance.',
      'items': {
        'type': 'string',
        'title': 'Member name.',
        'description': 'An explanation about the purpose of this instance.'
      },
      'minItems': 1
    }
  },
  'required': [
    'name',
    'password',
    'members'
  ]
};

export const postLoginSchema = {
  'type': 'object',
  'title': 'Root schema.',
  'description': 'An explanation about the purpose of this instance.',
  'properties': {
    'name': {
      'type': 'string',
      'title': 'Team name.',
      'description': 'An explanation about the purpose of this instance.',
    },
    'password': {
      'type': 'string',
      'title': 'Team password.',
      'description': 'An explanation about the purpose of this instance.',
    }
  },
  'required': [
    'name',
    'password'
  ]
};

export const postQueueSchema = {
  'type': 'object',
  'title': 'Root schema.',
  'description': 'An explanation about the purpose of this instance.',
  'properties': {
    'team_id': {
      'type': 'number',
      'title': 'Team id.',
      'description': 'An explanation about the purpose of this instance.',
    },
    'access_token': {
      'type': 'string',
      'title': 'Published access token.',
      'description': 'An explanation about the purpose of this instance.',
    }
  },
  'required': [
    'team_id',
    'access_token'
  ]
};

export const updateTeamSchema = {
  'type': 'object',
  'title': 'Root schema.',
  'description': 'An explanation about the purpose of this instance.',
  'properties': {
    'host': {
      'type': 'string',
      'title': 'Team application server host.',
      'description': 'An explanation about the purpose of this instance.',
    },
    'members': {
      'type': 'array',
      'title': 'Members schema.',
      'description': 'An explanation about the purpose of this instance.',
      'items': {
        'type': 'string',
        'title': 'Member name.',
        'description': 'An explanation about the purpose of this instance.'
      },
      'maxItems': 2
    },
    'lang': {
      'type': 'string',
      'title': 'Team application language.',
      'description': 'An explanation about the purpose of this instance.',
    },
    'access_token': {
      'type': 'string',
      'title': 'Published access token.',
      'description': 'An explanation about the purpose of this instance.',
    }
  },
  'required': [
    'host',
    'access_token'
  ]
};
