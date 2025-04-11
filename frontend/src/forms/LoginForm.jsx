import React from 'react';
import { Form, Input, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';

export default function LoginForm() {
  const translate = useLanguage();
  return (
    <div>
      <Form.Item
        label={translate('username')}
        name="username"
        rules={[
          {
            required: true,
          },
          {
            type: 'username',
          },
        ]}
      >
        <Input
          prefix={<UserOutlined className="site-form-item-icon" />}
          size="large"
        />
      </Form.Item>
      <Form.Item
        label={translate('password')}
        name="password"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          size="large"
        />
      </Form.Item>
    </div>
  );
}
