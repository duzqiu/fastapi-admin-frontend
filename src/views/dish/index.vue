<template>
  <div class="page-container">
    <PageHeader title="菜品列表" description="维护菜名、图片、价格、库存、分类标签，以及每道菜的套餐与售卖规则" />

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div v-for="card in cards" :key="card.key" class="stat-card app-card">
        <div class="stat-card__icon" :style="{ background: card.bg, color: card.color }">
          <el-icon :size="18"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__label">{{ card.label }}</span>
          <strong class="stat-card__value">{{ formatNumber(card.value) }}</strong>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="app-card">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="菜名 / 描述"
            clearable
            style="width: 190px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="query.category_id" placeholder="全部分类" clearable style="width: 140px">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>

          <el-select v-model="query.tag_id" placeholder="全部标签" clearable style="width: 130px">
            <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>

          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option v-for="item in DISH_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

          <el-checkbox v-model="query.low_stock" label="只看库存告急" border size="default" />

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>

        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon> 新建菜品
        </el-button>
      </div>

      <!-- 菜品表格 -->
      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无菜品">
        <el-table-column prop="id" label="ID" width="64" />

        <el-table-column label="菜品" min-width="230">
          <template #default="{ row }">
            <div class="dish-cell">
              <el-image v-if="row.image" :src="row.image" fit="cover" class="dish-cell__img">
                <template #error>
                  <div class="dish-cell__img dish-cell__img--empty"><el-icon><Bowl /></el-icon></div>
                </template>
              </el-image>
              <div v-else class="dish-cell__img dish-cell__img--empty"><el-icon><Bowl /></el-icon></div>

              <div class="dish-cell__info">
                <div class="dish-cell__title">
                  <span class="dish-cell__name">{{ row.name }}</span>
                  <el-tag v-if="row.is_recommended" size="small" type="danger" effect="plain">推荐</el-tag>
                </div>
                <span class="dish-cell__sub">{{ row.category_name || '未分类' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="标签" width="170">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag.id"
              :type="tag.color || 'info'"
              size="small"
              effect="light"
              class="tag-chip"
            >
              {{ tag.name }}
            </el-tag>
            <span v-if="!row.tags.length" class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="价格" width="100" align="right">
          <template #default="{ row }">
            <span class="price">{{ formatMoney(row.price) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="库存" width="90" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.stock < 10 }">{{ row.stock }}</span>
          </template>
        </el-table-column>

        <el-table-column label="已售" width="90" align="right">
          <template #default="{ row }">
            <span class="sold">{{ formatNumber(row.sold_count) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="套餐" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSpecs(row)">{{ row.spec_count }} 个</el-button>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="dishStatusTagType(row.status)" size="small" effect="light">
              {{ dishStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSpecs(row)">套餐</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="openStock(row)">库存</el-button>
            <el-button
              link
              :type="row.status === 'on_sale' ? 'info' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'on_sale' ? '下架' : '上架' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 菜品编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑菜品' : '新建菜品'"
      width="680px"
      top="6vh"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="82px">
        <el-row :gutter="12">
          <el-col :span="14">
            <el-form-item label="菜名" prop="name">
              <el-input v-model="form.name" maxlength="100" placeholder="请输入菜名" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="分类">
              <el-select v-model="form.category_id" placeholder="请选择分类" clearable style="width: 100%">
                <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="图片">
          <div class="image-editor">
            <el-image v-if="form.image" :src="form.image" fit="cover" class="image-editor__preview">
              <template #error>
                <div class="image-editor__preview image-editor__preview--empty">
                  <el-icon><Bowl /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="image-editor__preview image-editor__preview--empty">
              <el-icon><Bowl /></el-icon>
            </div>

            <div class="image-editor__body">
              <el-input v-model="form.image" placeholder="图片地址，也可直接上传" clearable />
              <div class="image-editor__actions">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleUpload"
                  accept="image/*"
                  class="upload-inline"
                >
                  <el-button size="small" :loading="uploading">
                    <el-icon><Upload /></el-icon> 上传图片
                  </el-button>
                </el-upload>
                <span class="text-muted">支持 jpg / png / webp / gif，≤ 5MB</span>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="标签">
          <el-select v-model="form.tag_ids" multiple placeholder="可多选" style="width: 100%">
            <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位">
              <el-input v-model="form.unit" maxlength="10" placeholder="份 / 碗 / 杯" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="item in DISH_STATUS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="推荐">
              <el-switch v-model="form.is_recommended" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit
            placeholder="菜品介绍、口味说明等"
          />
        </el-form-item>

        <el-alert
          v-if="!dialog.isEdit"
          type="info"
          :closable="false"
          show-icon
          title="新建完成后可在「套餐」中为该菜品添加单点 / 单人套餐等不同规格与售卖规则；不添加套餐时，下单直接使用菜品本身的价格与库存。"
        />
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 套餐 / 规格抽屉 -->
    <el-drawer v-model="specDrawer.visible" :title="`套餐与规则 · ${specDrawer.dishName}`" size="900px">
      <div class="spec-toolbar">
        <div class="spec-toolbar__tip">
          套餐承载独立的价格、库存、销量与售卖规则；菜品总库存需与套餐库存同时满足才能下单。
        </div>
        <el-button type="primary" @click="openSpecForm()">
          <el-icon><Plus /></el-icon> 新增套餐
        </el-button>
      </div>

      <el-table v-loading="specDrawer.loading" :data="specDrawer.specs" stripe empty-text="该菜品暂无套餐">
        <el-table-column label="套餐名称" min-width="150">
          <template #default="{ row }">
            <div class="spec-name">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.is_default" size="small" type="primary" effect="plain">默认</el-tag>
            </div>
            <span class="text-muted">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="90" align="right">
          <template #default="{ row }">{{ formatMoney(row.price) }}</template>
        </el-table-column>
        <el-table-column label="库存" width="70" align="right">
          <template #default="{ row }">{{ row.stock }}</template>
        </el-table-column>
        <el-table-column label="已售" width="70" align="right">
          <template #default="{ row }">{{ row.sold_count }}</template>
        </el-table-column>
        <el-table-column label="规则" min-width="220">
          <template #default="{ row }">
            <div class="rule-list">
              <el-tag size="small" effect="plain">起购 {{ row.min_quantity }} 份</el-tag>
              <el-tag size="small" effect="plain">
                {{ row.max_quantity_per_order ? `每单限购 ${row.max_quantity_per_order} 份` : '不限购' }}
              </el-tag>
              <el-tag size="small" effect="plain">
                {{ row.daily_limit ? `每日限量 ${row.daily_limit} 份（今日已售 ${row.sold_today}）` : '不限量' }}
              </el-tag>
              <el-tag size="small" effect="plain">{{ row.serve_time_text }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small" effect="light">
              {{ row.is_active ? '可售' : '停售' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSpecForm(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteSpec(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 套餐编辑弹窗 -->
    <el-dialog
      v-model="specFormDialog.visible"
      :title="specFormDialog.isEdit ? '编辑套餐' : '新增套餐'"
      width="600px"
      append-to-body
      destroy-on-close
      @closed="resetSpecForm"
    >
      <el-form ref="specFormRef" :model="specForm" :rules="specRules" label-width="96px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="specForm.name" maxlength="50" placeholder="如：单点 / 单人套餐 / 双人套餐" />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="specForm.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="specForm.stock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="起购份数">
              <el-input-number v-model="specForm.min_quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每单限购">
              <el-input-number v-model="specForm.max_quantity_per_order" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每日限量">
              <el-input-number v-model="specForm.daily_limit" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="rule-hint">限购 / 限量填 0 表示不限制</div>

        <el-form-item label="供应时段">
          <div class="time-range">
            <el-time-select
              v-model="specForm.serve_start_time"
              start="00:00"
              step="00:30"
              end="23:30"
              placeholder="开始"
              clearable
              style="width: 130px"
            />
            <span class="time-range__sep">至</span>
            <el-time-select
              v-model="specForm.serve_end_time"
              start="00:00"
              step="00:30"
              end="23:30"
              placeholder="结束"
              clearable
              style="width: 130px"
            />
            <span class="text-muted">留空表示全天供应，支持跨零点（如 22:00 - 02:00）</span>
          </div>
        </el-form-item>

        <el-form-item label="说明">
          <el-input v-model="specForm.description" maxlength="200" placeholder="套餐包含内容，如「含米饭 + 例汤」" />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="specForm.sort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="默认">
              <el-switch v-model="specForm.is_default" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="可售">
              <el-switch v-model="specForm.is_active" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="specFormDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSpecSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 库存调整弹窗 -->
    <el-dialog v-model="stockDialog.visible" title="调整库存" width="420px" destroy-on-close>
      <el-form label-width="82px">
        <el-form-item label="菜品">
          <el-input :model-value="stockDialog.dishName" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :model-value="stockDialog.current" disabled />
        </el-form-item>
        <el-form-item label="调整方式">
          <el-radio-group v-model="stockDialog.mode">
            <el-radio-button value="add">补货 / 报损</el-radio-button>
            <el-radio-button value="set">直接设为</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="stockDialog.mode === 'add' ? '增减数量' : '库存数量'">
          <el-input-number
            v-model="stockDialog.quantity"
            :min="stockDialog.mode === 'add' ? -9999 : 0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="stockDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleStockSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createDish,
  createDishSpec,
  deleteDish,
  deleteDishSpec,
  fetchCategories,
  fetchDishes,
  fetchDishSpecs,
  fetchDishStats,
  fetchTags,
  updateDish,
  updateDishSpec,
  updateDishStatus,
  updateDishStock,
  uploadDishImage,
} from '@/api/dish'
import PageHeader from '@/components/PageHeader.vue'
import { DISH_STATUS, dishStatusLabel, dishStatusTagType } from '@/constants'
import { formatMoney, formatNumber } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
const uploading = ref(false)

const rows = ref([])
const total = ref(0)
const categories = ref([])
const tags = ref([])
const stats = ref({ total: 0, on_sale: 0, low_stock: 0, total_sold: 0 })

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  category_id: undefined,
  tag_id: undefined,
  status: '',
  low_stock: false,
})

const formRef = ref(null)
const specFormRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })
const specDrawer = reactive({ visible: false, dishId: null, dishName: '', specs: [], loading: false })
const specFormDialog = reactive({ visible: false, isEdit: false, specId: null })
const stockDialog = reactive({ visible: false, dishId: null, dishName: '', current: 0, quantity: 0, mode: 'add' })

const defaultForm = () => ({
  id: null,
  name: '',
  description: '',
  image: '',
  price: 0,
  stock: 0,
  unit: '份',
  status: 'on_sale',
  is_recommended: false,
  sort: 0,
  category_id: undefined,
  tag_ids: [],
})
const form = reactive(defaultForm())

const defaultSpecForm = () => ({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  is_default: false,
  is_active: true,
  sort: 0,
  min_quantity: 1,
  max_quantity_per_order: 0,
  daily_limit: 0,
  serve_start_time: '',
  serve_end_time: '',
})
const specForm = reactive(defaultSpecForm())

const cards = computed(() => [
  { key: 'total', label: '菜品总数', value: stats.value.total, icon: 'Bowl', color: 'var(--blue)', bg: 'var(--blue-soft)' },
  { key: 'on_sale', label: '在售中', value: stats.value.on_sale, icon: 'CircleCheck', color: 'var(--leaf-text)', bg: 'var(--lime-soft)' },
  { key: 'low', label: '库存告急', value: stats.value.low_stock, icon: 'WarnTriangleFilled', color: '#b47f18', bg: 'rgba(232, 190, 96, 0.18)' },
  { key: 'sold', label: '累计销量', value: stats.value.total_sold, icon: 'ShoppingCart', color: 'var(--cat-2-ink)', bg: 'var(--cat-2-bg)' },
])

const formRules = {
  name: [
    { required: true, message: '请输入菜名', trigger: 'blur' },
    { max: 100, message: '菜名最多 100 个字符', trigger: 'blur' },
  ],
}

const specRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
}

function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.category_id) params.category_id = query.category_id
  if (query.tag_id) params.tag_id = query.tag_id
  if (query.status) params.status = query.status
  if (query.low_stock) params.low_stock = true
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchDishes(buildParams())
    rows.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    const [categoryList, tagList, statsData] = await Promise.all([
      fetchCategories(),
      fetchTags(),
      fetchDishStats(),
    ])
    categories.value = categoryList
    tags.value = tagList
    stats.value = statsData
  } catch (error) {
    // 拦截器已提示
  }
}

function loadAll() {
  loadData()
  loadOptions()
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.category_id = undefined
  query.tag_id = undefined
  query.status = ''
  query.low_stock = false
  handleSearch()
}

// ---------------- 菜品表单 ----------------
function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  dialog.isEdit = false
  dialog.visible = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    image: row.image || '',
    price: row.price,
    stock: row.stock,
    unit: row.unit,
    status: row.status,
    is_recommended: row.is_recommended,
    sort: row.sort,
    category_id: row.category_id || undefined,
    tag_ids: (row.tags || []).map((tag) => tag.id),
  })
  dialog.isEdit = true
  dialog.visible = true
}

async function handleUpload(file) {
  uploading.value = true
  try {
    const data = await uploadDishImage(file)
    form.image = data.url
    ElMessage.success('图片上传成功')
  } catch (error) {
    // 拦截器已提示
  } finally {
    uploading.value = false
  }
  return false // 阻止组件自带的上传行为
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description,
      image: form.image,
      price: form.price,
      stock: form.stock,
      unit: form.unit,
      status: form.status,
      is_recommended: form.is_recommended,
      sort: form.sort,
      category_id: form.category_id || null,
      tag_ids: form.tag_ids,
    }
    if (dialog.isEdit) {
      await updateDish(form.id, payload)
      ElMessage.success('菜品已更新')
    } else {
      await createDish(payload)
      ElMessage.success('菜品已创建，可在「套餐」中添加规格与规则')
    }
    dialog.visible = false
    loadAll()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row) {
  const next = row.status === 'on_sale' ? 'off_shelf' : 'on_sale'
  try {
    await updateDishStatus(row.id, next)
    ElMessage.success(next === 'on_sale' ? '已上架' : '已下架')
    loadAll()
  } catch (error) {
    // 拦截器已提示
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除菜品「${row.name}」吗？其套餐会一并删除。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }
  try {
    await deleteDish(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadAll()
  } catch (error) {
    // 拦截器已提示
  }
}

// ---------------- 库存 ----------------
function openStock(row) {
  stockDialog.dishId = row.id
  stockDialog.dishName = row.name
  stockDialog.current = row.stock
  stockDialog.quantity = 0
  stockDialog.mode = 'add'
  stockDialog.visible = true
}

async function handleStockSubmit() {
  submitting.value = true
  try {
    await updateDishStock(stockDialog.dishId, stockDialog.quantity, stockDialog.mode)
    ElMessage.success('库存已调整')
    stockDialog.visible = false
    loadAll()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

// ---------------- 套餐 ----------------
async function openSpecs(row) {
  specDrawer.dishId = row.id
  specDrawer.dishName = row.name
  specDrawer.visible = true
  await loadSpecs()
}

async function loadSpecs() {
  specDrawer.loading = true
  try {
    specDrawer.specs = await fetchDishSpecs(specDrawer.dishId)
  } catch (error) {
    // 拦截器已提示
  } finally {
    specDrawer.loading = false
  }
}

function resetSpecForm() {
  Object.assign(specForm, defaultSpecForm())
  specFormRef.value?.clearValidate()
}

function openSpecForm(spec) {
  resetSpecForm()
  if (spec) {
    Object.assign(specForm, {
      name: spec.name,
      description: spec.description || '',
      price: spec.price,
      stock: spec.stock,
      is_default: spec.is_default,
      is_active: spec.is_active,
      sort: spec.sort,
      min_quantity: spec.min_quantity,
      max_quantity_per_order: spec.max_quantity_per_order,
      daily_limit: spec.daily_limit,
      serve_start_time: spec.serve_start_time || '',
      serve_end_time: spec.serve_end_time || '',
    })
  }
  specFormDialog.isEdit = Boolean(spec)
  specFormDialog.specId = spec?.id ?? null
  specFormDialog.visible = true
}

async function handleSpecSubmit() {
  try {
    await specFormRef.value.validate()
  } catch (error) {
    return
  }

  if (Boolean(specForm.serve_start_time) !== Boolean(specForm.serve_end_time)) {
    ElMessage.warning('供应开始与结束时间需要同时填写或同时留空')
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: specForm.name.trim(),
      description: specForm.description,
      price: specForm.price,
      stock: specForm.stock,
      is_default: specForm.is_default,
      is_active: specForm.is_active,
      sort: specForm.sort,
      min_quantity: specForm.min_quantity,
      max_quantity_per_order: specForm.max_quantity_per_order,
      daily_limit: specForm.daily_limit,
      serve_start_time: specForm.serve_start_time || '',
      serve_end_time: specForm.serve_end_time || '',
    }
    if (specFormDialog.isEdit) {
      await updateDishSpec(specDrawer.dishId, specFormDialog.specId, payload)
      ElMessage.success('套餐已更新')
    } else {
      await createDishSpec(specDrawer.dishId, payload)
      ElMessage.success('套餐已创建')
    }
    specFormDialog.visible = false
    loadSpecs()
    loadAll()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleDeleteSpec(spec) {
  try {
    await ElMessageBox.confirm(`确定删除套餐「${spec.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }
  try {
    await deleteDishSpec(specDrawer.dishId, spec.id)
    ElMessage.success('删除成功')
    loadSpecs()
    loadAll()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(loadAll)
</script>

<style scoped lang="scss">
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 16px 18px;

  &__icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: var(--r-sm);
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-soft);
  }

  &__value {
    font-family: var(--font-mono);
    font-size: 24px;
    font-weight: 650;
    line-height: 1.15;
    letter-spacing: -0.03em;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
}

.dish-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  &__img {
    width: 46px;
    height: 46px;
    border-radius: 9px;
    flex-shrink: 0;
    background: var(--app-bg);

    &--empty {
      display: grid;
      place-items: center;
      color: var(--app-text-placeholder);
      font-size: 18px;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    line-height: 1.35;
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__name {
    font-weight: 600;
    color: var(--app-text);
  }

  &__sub {
    font-size: 12px;
    color: var(--app-text-placeholder);
  }
}

.tag-chip + .tag-chip {
  margin-left: 4px;
}

.price {
  font-weight: 600;
  color: #ef4444;
}

.sold {
  color: var(--app-primary);
  font-weight: 600;
}

.text-muted {
  font-size: 12px;
  color: var(--app-text-placeholder);
}

.text-danger {
  color: var(--app-danger);
  font-weight: 600;
}

.image-editor {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;

  &__preview {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    flex-shrink: 0;
    background: var(--app-bg);

    &--empty {
      display: grid;
      place-items: center;
      color: var(--app-text-placeholder);
      font-size: 22px;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }
}

.upload-inline {
  :deep(.el-upload) {
    display: inline-block;
  }
}

.spec-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  &__tip {
    font-size: 12px;
    color: var(--app-text-secondary);
  }
}

.spec-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.rule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rule-hint {
  margin: -8px 0 12px 96px;
  font-size: 12px;
  color: var(--app-text-placeholder);
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  &__sep {
    color: var(--app-text-placeholder);
  }
}
</style>
