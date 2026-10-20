<template>
  <div class="page-container">
    <PageHeader
      title="欢迎语"
      description="个人网站 · 首页中间的主标题、副标题，以及品牌名下方的祝福语"
    />

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card v-loading="loading" shadow="never" class="app-card">
          <template #header><span class="card-title">内容设置</span></template>

          <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
            <el-form-item label="主标题" prop="title">
              <el-input
                v-model="form.title"
                maxlength="200"
                show-word-limit
                placeholder="例如：测试工程师（AI + Python）"
              />
            </el-form-item>
            <el-form-item label="副标题" prop="subtitle">
              <el-input
                v-model="form.subtitle"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 4 }"
                maxlength="300"
                show-word-limit
                placeholder="例如：功能测试 · 自动化测试 · 接口测试"
              />
            </el-form-item>
            <el-form-item label="祝福语" prop="blessing">
              <el-input
                v-model="form.blessing"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 4 }"
                maxlength="300"
                show-word-limit
                placeholder="显示在「奔波儿灞」品牌名下方，例如：愿你今天也有好心情。"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="handleSubmit">
                保存修改
              </el-button>
              <el-button @click="loadData">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="app-card preview-card">
          <template #header><span class="card-title">首页预览</span></template>
          <div class="preview">
            <p class="preview__title">{{ form.title || '主标题' }}</p>
            <p class="preview__subtitle">{{ form.subtitle || '副标题' }}</p>
            <span class="preview__rule" />
            <p class="preview__brand">
              奔波儿灞
              <span v-if="form.blessing" class="preview__blessing">{{ form.blessing }}</span>
            </p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'

import { fetchSiteWelcome, updateSiteWelcome } from '@/api/site'
import { ElMessage } from 'element-plus'

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  title: '',
  subtitle: '',
  blessing: '',
})

const rules = {
  title: [{ required: true, message: '请输入首页主标题', trigger: 'blur' }],
  subtitle: [{ required: true, message: '请输入首页副标题', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchSiteWelcome()
    Object.assign(form, {
      title: data.title || '',
      subtitle: data.subtitle || '',
      blessing: data.blessing || '',
    })
  } catch (error) {
    ElMessage.error(error.message || '欢迎语加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await updateSiteWelcome({
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      blessing: form.blessing.trim(),
    })
    ElMessage.success('首页欢迎语已保存')
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-title {
  font-size: 14px;
  font-weight: 600;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 34px 20px;
  text-align: center;
}

.preview__title {
  color: var(--el-text-color-primary);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.35;
}

.preview__subtitle {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.preview__rule {
  width: 150px;
  height: 1px;
  margin-top: 24px;
  background: linear-gradient(90deg, transparent, var(--el-color-primary), transparent);
}

.preview__brand {
  margin-top: 28px;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.preview__blessing {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  font-weight: 400;
}
</style>
