import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Tabs,
  Table,
  Space,
  Typography,
  Form,
  Input,
  Switch,
  Button,
  Tag,
  message,
  Divider,
  Statistic,
  Row,
  Col,
  Modal,
  List,
  Select,
  Popover,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import api from "../api";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SelectedInventroyPage() {
  const { id } = useParams();
  const authUser = useSelector((s) => s.auth.user);
  const [inventory, setInventory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [comments, setComments] = useState([]);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemForm] = Form.useForm();

  const [addCommentOpen, setAddCommentOpen] = useState(false);
  const [addCommentForm] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const [generalForm] = Form.useForm();

  const [customIdFormat, setCustomIdFormat] = useState([]);
  const [nextSequence, setNextSequence] = useState(1);

  useEffect(() => {
    fetchAll();
  }, [id]);

  async function fetchAll() {
    setLoading(true);
    try {
      const invRes = await api.get(`/api/inventory/${id}`);
      setInventory(invRes.data);
      const itemsRes = await api.get(`/api/inventory/${id}/items`);
      setItems(itemsRes.data.items || []);
      const fieldsRes = await api.get(`/api/inventory/${id}/fields`);
      setFields(fieldsRes.data.fields || []);
      const commentsRes = await api.get(`/api/inventory/${id}/comments`);
      setComments(commentsRes.data.comments || []);
      // load custom ID format (stored on inventory)
      setCustomIdFormat(invRes.data.customIdFormat || []);
      setNextSequence(invRes.data.nextSequence || 1);
    } catch (e) {
      message.error(e.response?.data?.error || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  const itemColumns = useMemo(() => {
    const base = [
      {
        title: "Item",
        dataIndex: "name",
        key: "name",
        render: (text, record) => (
          <Button
            type="link"
            onClick={() => message.info("Open item page TBD")}
          >
            {text}
          </Button>
        ),
      },
      { title: "Custom ID", dataIndex: "customId", key: "customId" },
    ];
    const dynamic = fields.map((f) => ({
      title: f.label || f.key,
      dataIndex: ["values", f.key],
      key: f.key,
      render: (v) =>
        v === null || v === undefined || v === "" ? (
          <Text type="secondary">—</Text>
        ) : (
          String(v)
        ),
    }));
    return [...base, ...dynamic];
  }, [fields]);

  const stats = useMemo(() => {
    const count = items.length;
    const numericKeys = fields
      .filter((f) => f.type === "number")
      .map((f) => f.key);
    const aggregates = {};
    for (const key of numericKeys) {
      const values = items
        .map((it) => Number(it.values?.[key]))
        .filter((n) => Number.isFinite(n));
      if (values.length) {
        const sum = values.reduce((a, b) => a + b, 0);
        aggregates[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: sum / values.length,
        };
      }
    }
    return { count, aggregates };
  }, [items, fields]);

  const canWrite = useMemo(() => {
    if (!authUser || !inventory) return false;
    if (authUser.isAdmin) return true;
    if (inventory.creatorId === authUser.id) return true;
    if (Array.isArray(inventory.writeAccess)) {
      return inventory.writeAccess.some((wa) => wa.userId === authUser.id);
    }
    return false;
  }, [authUser, inventory]);

  const canAdmin = useMemo(() => {
    if (!authUser || !inventory) return false;
    return authUser.isAdmin || inventory.creatorId === authUser.id;
  }, [authUser, inventory]);

  async function handleCreateItem(values) {
    try {
      await api.post(`/api/inventory/${id}/items`, values);
      message.success("Item created");
      setAddItemOpen(false);
      addItemForm.resetFields();
      const itemsRes = await api.get(`/api/inventory/${id}/items`);
      setItems(itemsRes.data.items || []);
    } catch (e) {
      message.error(
        e.response?.data?.error || e.message || "Failed to create item",
      );
    }
  }

  async function handleCreateComment(values) {
    try {
      await api.post(`/api/inventory/${id}/comments`, values);
      message.success("Comment added");
      setAddCommentOpen(false);
      addCommentForm.resetFields();
      const commentsRes = await api.get(`/api/inventory/${id}/comments`);
      setComments(commentsRes.data.comments || []);
    } catch (e) {
      message.error(
        e.response?.data?.error || e.message || "Failed to add comment",
      );
    }
  }

  async function handleUpdateGeneral(values) {
    try {
      await api.put(`/api/inventory/${id}`, values);
      message.success("Updated");
      fetchAll();
    } catch (e) {
      message.error(e.response?.data?.error || "Update failed");
    }
  }

  async function handleSaveCustomNumbers(values) {
    try {
      await api.put(`/api/inventory/${id}/numbers`, values);
      message.success("Saved");
    } catch (e) {
      message.error(e.response?.data?.error || "Save failed");
    }
  }

  async function handleSaveFields(newFields) {
    try {
      await api.put(`/api/inventory/${id}/fields`, { fields: newFields });
      message.success("Fields updated");
      setFields(newFields);
    } catch (e) {
      message.error(e.response?.data?.error || "Update failed");
    }
  }

  async function handleSaveAccess(values) {
    try {
      await api.put(`/api/inventory/${id}/access`, values);
      message.success("Access updated");
    } catch (e) {
      message.error(e.response?.data?.error || "Update failed");
    }
  }

  const elementOptions = [
    { value: "text", label: "Fixed text" },
    { value: "rand20", label: "20-bit random" },
    { value: "rand32", label: "32-bit random" },
    { value: "rand6d", label: "6-digit random" },
    { value: "rand9d", label: "9-digit random" },
    { value: "guid", label: "GUID" },
    { value: "datetime", label: "Date/Time" },
    { value: "sequence", label: "Sequence" },
  ];

  function renderCustomIdPreview(list) {
    const parts = list.map((el) => {
      switch (el.type) {
        case "text":
          return el.value || "";
        case "rand20":
          return Math.floor(Math.random() * 2 ** 20).toString();
        case "rand32":
          return Math.floor(Math.random() * 2 ** 32).toString();
        case "rand6d":
          return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
        case "rand9d":
          return String(Math.floor(Math.random() * 1_000_000_000)).padStart(
            9,
            "0",
          );
        case "guid":
          return Math.random().toString(36).slice(2, 10);
        case "datetime":
          return new Date().toISOString();
        case "sequence":
          return String(nextSequence).padStart(el.minWidth || 1, "0");
        default:
          return "";
      }
    });
    return parts.join("");
  }

  const itemsTab = (
    <Card>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Items
        </Title>
        <Button
          type="primary"
          onClick={() => setAddItemOpen(true)}
          disabled={!canWrite}
        >
          Add Item
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={itemColumns}
        dataSource={items}
        loading={loading}
      />

      <Modal
        title="Add Item"
        open={addItemOpen}
        onCancel={() => {
          setAddItemOpen(false);
          addItemForm.resetFields();
        }}
        onOk={() => addItemForm.submit()}
        okText="Create"
        destroyOnClose
      >
        <Form form={addItemForm} layout="vertical" onFinish={handleCreateItem}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Item name" />
          </Form.Item>
          <Form.Item
            name="customId"
            label={
              <Space>
                <Text>Custom ID</Text>
                <Popover
                  content={
                    <div style={{ maxWidth: 320 }}>
                      <Text>
                        Custom ID is auto-generated from the inventory's Custom
                        ID format. You may edit it if needed. Uniqueness is
                        enforced within this inventory.
                      </Text>
                    </div>
                  }
                >
                  <Tag>help</Tag>
                </Popover>
              </Space>
            }
          >
            <Input placeholder={renderCustomIdPreview(customIdFormat)} />
          </Form.Item>
          {fields.map((f) => (
            <Form.Item
              key={f.key}
              name={["values", f.key]}
              label={f.label || f.key}
            >
              {f.type === "boolean" ? (
                <Switch />
              ) : f.type === "number" ? (
                <Input type="number" />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Card>
  );

  const discussionTab = (
    <Card>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Discussion
        </Title>
        <Button type="primary" onClick={() => setAddCommentOpen(true)}>
          Add Comment
        </Button>
      </Space>
      <List
        dataSource={comments}
        locale={{ emptyText: "No comments yet" }}
        renderItem={(c) => (
          <List.Item key={c.id}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Text strong>{c.user?.name || "User"}</Text>
                <Text type="secondary">
                  {new Date(c.createdAt).toLocaleString()}
                </Text>
              </Space>
              <Text>{c.content}</Text>
            </Space>
          </List.Item>
        )}
      />

      <Modal
        title="Add Comment"
        open={addCommentOpen}
        onCancel={() => {
          setAddCommentOpen(false);
          addCommentForm.resetFields();
        }}
        onOk={() => addCommentForm.submit()}
        okText="Post"
        destroyOnHidden
      >
        <Form
          form={addCommentForm}
          layout="vertical"
          onFinish={handleCreateComment}
        >
          <Form.Item
            name="content"
            label="Comment"
            rules={[{ required: true, min: 1 }]}
          >
            <Input.TextArea rows={4} placeholder="Write a comment..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );

  const generalTab = (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>
          General settings
        </Title>
        {canAdmin && (
          <Button onClick={() => setEditMode((v) => !v)}>
            {editMode ? "View" : "Edit"}
          </Button>
        )}
      </Space>
      <Form
        form={generalForm}
        layout="vertical"
        initialValues={{
          title: inventory?.title,
          description: inventory?.description,
          image: inventory?.image,
          isPublic: inventory?.isPublic,
        }}
        onFinish={handleUpdateGeneral}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, min: 3 }]}
        >
          <Input
            placeholder="Inventory title"
            disabled={!editMode || !canAdmin}
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea
            rows={4}
            placeholder="Optional description"
            disabled={!editMode || !canAdmin}
          />
        </Form.Item>
        <Form.Item name="image" label="Image">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Upload
                accept="image/*"
                showUploadList={false}
                disabled={!editMode || !canAdmin}
                customRequest={async ({ file, onSuccess, onError }) => {
                  try {
                    console.log(
                      "Uploading file:",
                      file.name,
                      "Size:",
                      file.size,
                    );

                    const fd = new FormData();
                    fd.append("file", file);

                    const res = await api.post(
                      `/api/inventory/upload-image`,
                      fd,
                      {
                        headers: { "Content-Type": "multipart/form-data" },
                      },
                    );

                    const { url } = res.data || {};
                    if (!url) throw new Error("No URL returned");

                    generalForm.setFieldsValue({ image: url });
                    message.success("Image uploaded successfully");
                    onSuccess?.("ok");
                  } catch (e) {
                    console.error("Upload error:", e);
                    const errorMsg =
                      e.response?.data?.error || e.message || "Upload failed";
                    message.error(errorMsg);
                    onError?.(e);
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Space>
            {inventory?.image && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={inventory.image}
                  alt="Inventory"
                  style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4 }}
                />
              </div>
            )}
          </Space>
        </Form.Item>
        <Form.Item name="isPublic" label="Visibility" valuePropName="checked">
          <Switch
            checkedChildren="Public"
            unCheckedChildren="Private"
            disabled={!editMode || !canAdmin}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!editMode || !canAdmin}
          >
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const customNumbersTab = (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>
          Custom ID
        </Title>
        {canAdmin && (
          <Button onClick={() => setEditMode((v) => !v)}>
            {editMode ? "View" : "Edit"}
          </Button>
        )}
      </Space>
      <Text type="secondary">
        Build the custom ID format. Drag to reorder using the up/down buttons.
        Preview updates in real-time.
      </Text>
      <Divider />
      <Space direction="vertical" style={{ width: "100%" }}>
        {customIdFormat.map((el, idx) => (
          <Space key={idx} wrap>
            <Select
              value={el.type}
              options={elementOptions}
              disabled={!editMode || !canAdmin}
              onChange={(val) => {
                const copy = [...customIdFormat];
                copy[idx] = { ...copy[idx], type: val };
                setCustomIdFormat(copy);
              }}
              style={{ width: 200 }}
            />
            {el.type === "text" && (
              <Input
                placeholder="Fixed text"
                value={el.value}
                disabled={!editMode || !canAdmin}
                onChange={(e) => {
                  const copy = [...customIdFormat];
                  copy[idx] = { ...copy[idx], value: e.target.value };
                  setCustomIdFormat(copy);
                }}
                style={{ width: 260 }}
              />
            )}
            {el.type === "sequence" && (
              <Input
                placeholder="Min width (e.g., 4)"
                type="number"
                value={el.minWidth}
                disabled={!editMode || !canAdmin}
                onChange={(e) => {
                  const copy = [...customIdFormat];
                  copy[idx] = {
                    ...copy[idx],
                    minWidth: Number(e.target.value || 1),
                  };
                  setCustomIdFormat(copy);
                }}
                style={{ width: 200 }}
              />
            )}
            <Button
              disabled={!editMode || !canAdmin}
              onClick={() => {
                if (idx === 0) return;
                const copy = [...customIdFormat];
                const t = copy[idx - 1];
                copy[idx - 1] = copy[idx];
                copy[idx] = t;
                setCustomIdFormat(copy);
              }}
            >
              ↑
            </Button>
            <Button
              disabled={!editMode || !canAdmin}
              onClick={() => {
                if (idx === customIdFormat.length - 1) return;
                const copy = [...customIdFormat];
                const t = copy[idx + 1];
                copy[idx + 1] = copy[idx];
                copy[idx] = t;
                setCustomIdFormat(copy);
              }}
            >
              ↓
            </Button>
            <Button
              danger
              disabled={!editMode || !canAdmin}
              onClick={() =>
                setCustomIdFormat(customIdFormat.filter((_, i) => i !== idx))
              }
            >
              Remove
            </Button>
          </Space>
        ))}
        <Space wrap>
          <Button
            disabled={!editMode || !canAdmin}
            onClick={() =>
              setCustomIdFormat([
                ...customIdFormat,
                { type: "text", value: "-" },
              ])
            }
          >
            Add element
          </Button>
          <Popover
            content={
              <div style={{ maxWidth: 360 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                  Formatting help
                </Title>
                <ul>
                  <li>Fixed text: any Unicode string</li>
                  <li>
                    Random numbers: produce non-deterministic values, collisions
                    are possible
                  </li>
                  <li>
                    Sequence: increments per item; you can set minimum width for
                    leading zeros
                  </li>
                  <li>Date/time: ISO timestamp at creation</li>
                  <li>
                    GUID: pseudo random id; for production, you may use backend
                    generated ids
                  </li>
                </ul>
              </div>
            }
          >
            <Button>Help</Button>
          </Popover>
          <Button
            type="primary"
            disabled={!editMode || !canAdmin}
            onClick={async () => {
              try {
                const res = await api.put(`/api/inventory/${id}/numbers`, {
                  format: customIdFormat,
                });
                setNextSequence(res.data.nextSequence || nextSequence);
                message.success("Custom ID format saved");
              } catch (e) {
                message.error(e.response?.data?.error || "Save failed");
              }
            }}
          >
            Save
          </Button>
        </Space>
        <Divider />
        <Space>
          <Text strong>Preview:</Text>
          <Tag>{renderCustomIdPreview(customIdFormat)}</Tag>
          <Text type="secondary">Next sequence: {nextSequence}</Text>
        </Space>
      </Space>
    </Card>
  );

  const fieldsTab = (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>
          Item fields
        </Title>
        {canAdmin && (
          <Button onClick={() => setEditMode((v) => !v)}>
            {editMode ? "View" : "Edit"}
          </Button>
        )}
      </Space>
      <Text type="secondary">
        Define the schema for items in this inventory.
      </Text>
      <Divider />
      <Space direction="vertical" style={{ width: "100%" }}>
        {fields.map((f, idx) => (
          <Space key={f.key} style={{ width: "100%" }}>
            <Select
              style={{ width: 180 }}
              value={f.type}
              onChange={(val) => {
                const copy = [...fields];
                copy[idx] = { ...copy[idx], type: val };
                setFields(copy);
              }}
              options={[
                { value: "text", label: "String" },
                { value: "number", label: "Integer/Number" },
                { value: "boolean", label: "Boolean" },
              ]}
              disabled={!editMode || !canAdmin}
            />
            <Input
              style={{ width: 280 }}
              value={f.label}
              onChange={(e) => {
                const copy = [...fields];
                copy[idx] = { ...copy[idx], label: e.target.value };
                setFields(copy);
              }}
              placeholder="Field name (e.g., Enter your name)"
              disabled={!editMode || !canAdmin}
            />
            <Button
              danger
              disabled={!editMode || !canAdmin}
              onClick={() => setFields(fields.filter((x) => x !== f))}
            >
              Remove
            </Button>
          </Space>
        ))}
        <Space>
          <Button
            disabled={!editMode || !canAdmin}
            onClick={() =>
              setFields([
                ...fields,
                { key: `field_${fields.length + 1}`, label: "", type: "text" },
              ])
            }
          >
            Add field
          </Button>
          <Button
            type="primary"
            disabled={!editMode || !canAdmin}
            onClick={() => handleSaveFields(fields)}
          >
            Save fields
          </Button>
        </Space>
      </Space>
    </Card>
  );

  const accessTab = (
    <Card>
      <Title level={4}>Access settings</Title>
      <Form
        layout="vertical"
        onFinish={handleSaveAccess}
        initialValues={{
          isPublic: inventory?.isPublic,
          users: [],
        }}
      >
        <Form.Item
          name="isPublic"
          label="Public inventory"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item name="userEmails" label="User emails (comma separated)">
          <TextArea rows={3} placeholder="alice@example.com, bob@example.com" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const statsTab = (
    <Card>
      <Title level={4}>Statistics</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Statistic title="Items" value={stats.count} />
        </Col>
      </Row>
      <Divider>Numeric fields</Divider>
      {Object.keys(stats.aggregates).length === 0 ? (
        <Text type="secondary">No numeric fields.</Text>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          {Object.entries(stats.aggregates).map(([k, v]) => (
            <Card key={k} size="small" title={k}>
              <Space>
                <Tag>Min: {v.min}</Tag>
                <Tag>Avg: {v.avg.toFixed(2)}</Tag>
                <Tag>Max: {v.max}</Tag>
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </Card>
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          {inventory?.title || "Inventory"}
        </Title>
        {canAdmin && (
          <Button onClick={() => setEditMode((v) => !v)}>
            {editMode ? "View" : "Edit"}
          </Button>
        )}
      </Space>
      <Tabs
        defaultActiveKey="items"
        items={[
          { key: "items", label: "Items", children: itemsTab },
          { key: "discussion", label: "Discussion", children: discussionTab },
          { key: "general", label: "General", children: generalTab },
          { key: "numbers", label: "Custom ID", children: customNumbersTab },
          { key: "fields", label: "Item fields", children: fieldsTab },
          { key: "access", label: "Access", children: accessTab },
          { key: "stats", label: "Statistics", children: statsTab },
        ]}
      />
    </Space>
  );
}
