# simple-3D-transform

# 布局

主要是利用 绝对布局的方式 position:absolute


# 伪 3d 效果

首先wrap 层 设置 如下效果

```css
transform: perspective(xxx) rotateX(xxx) rotateY(xxx) scale3d(1, 1, 1);
```

perspective：指定透视距离
rotateX：指定对象在x轴上的旋转角度
rotateY：指定对象在y轴上的旋转角度
scale3d：指定对象的3D缩放。第1个参数对应X轴，第2个参数对应Y轴，第3个参数对应Z轴，参数不允许省略

 子层 设置如下效果

```css
transition: none 0s ease 0s; transform: matrix(1, 0, 0, 1, 0, 0);
 ```

matrix：以一个含六值的(a,b,c,d,e,f)变换矩阵的形式指定一个2D变换，相当于直接应用一个[a,b,c,d,e,f]变换矩阵


# 使用

见 demo.html 文件。
