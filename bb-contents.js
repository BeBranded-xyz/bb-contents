/**
 * BeBranded Contents
 * Contenus additionnels pour Webflow
 * @version 1.1.22-test.1
 * @author BeBranded
 * @license MIT
 * @website https://www.bebranded.xyz
 *
 * GENERATED FILE — do not edit directly.
 * Edit src/ files and run: npm run build
 */
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/modules/marquee.js
  var marquee = {
    _hasDropdownInBlock(block) {
      if (!block || !block.querySelector) return false;
      return block.querySelector(".w-dropdown") !== null || block.querySelector('[class*="dropdown"]') !== null;
    },
    _enableMarqueeDropdowns(block) {
      if (!block || !block.querySelectorAll) return;
      const items = block.querySelectorAll('.bb-marquee_item, [role="listitem"]');
      const itemList = items.length ? items : block.querySelectorAll(":scope > *");
      itemList.forEach(function(item) {
        const dropdowns = item.querySelectorAll('.w-dropdown, [class*="dropdown"]');
        dropdowns.forEach(function(dropdown) {
          const list = dropdown.querySelector('.w-dropdown-list, [class*="dropdown-list"], [class*="dropdown_list"]');
          const toggle = dropdown.querySelector('.w-dropdown-toggle, [class*="dropdown-toggle"]');
          if (!list || !toggle) return;
          item.style.overflow = "visible";
          dropdown.style.overflow = "visible";
          let portalWrapper = null;
          let leaveTimer = null;
          let scrollResizeCleanup = null;
          var marqueeEl = dropdown.closest("[data-bb-marquee-processed]");
          function updatePortalPosition() {
            if (!portalWrapper) return;
            var rect = toggle.getBoundingClientRect();
            portalWrapper.style.right = window.innerWidth - rect.right + "px";
            portalWrapper.style.top = rect.top + "px";
          }
          function closePortal() {
            if (leaveTimer) clearTimeout(leaveTimer);
            leaveTimer = null;
            if (scrollResizeCleanup) {
              scrollResizeCleanup();
              scrollResizeCleanup = null;
            }
            if (portalWrapper && portalWrapper.parentNode) {
              portalWrapper.parentNode.removeChild(portalWrapper);
            }
            portalWrapper = null;
            dropdown.classList.remove("w--open");
            if (marqueeEl) marqueeEl.removeAttribute("data-bb-marquee-dropdown-open");
          }
          function openPortal() {
            if (leaveTimer) clearTimeout(leaveTimer);
            leaveTimer = null;
            if (portalWrapper && portalWrapper.parentNode) return;
            if (marqueeEl) marqueeEl.setAttribute("data-bb-marquee-dropdown-open", "1");
            var rect = toggle.getBoundingClientRect();
            var listStyle = getComputedStyle(list);
            portalWrapper = document.createElement("div");
            portalWrapper.setAttribute("data-bb-marquee-dropdown-portal", "true");
            portalWrapper.className = "w-dropdown";
            portalWrapper.style.cssText = "position:fixed;transform:translateY(-100%);margin-top:-4px;z-index:9999;background:none;border:none;";
            var clone = list.cloneNode(true);
            clone.style.display = "block";
            clone.style.background = listStyle.background || listStyle.backgroundColor || "transparent";
            clone.style.backgroundColor = listStyle.backgroundColor;
            clone.style.backgroundImage = listStyle.backgroundImage;
            portalWrapper.appendChild(clone);
            portalWrapper.addEventListener("mouseenter", function() {
              if (leaveTimer) clearTimeout(leaveTimer);
              leaveTimer = null;
            });
            portalWrapper.addEventListener("mouseleave", function() {
              leaveTimer = setTimeout(closePortal, 120);
            });
            document.body.appendChild(portalWrapper);
            updatePortalPosition();
            dropdown.classList.add("w--open");
            var onScrollOrResize = function() {
              if (portalWrapper && portalWrapper.parentNode) updatePortalPosition();
            };
            window.addEventListener("scroll", onScrollOrResize, true);
            window.addEventListener("resize", onScrollOrResize);
            scrollResizeCleanup = function() {
              window.removeEventListener("scroll", onScrollOrResize, true);
              window.removeEventListener("resize", onScrollOrResize);
            };
          }
          dropdown.addEventListener("mouseenter", function() {
            if (leaveTimer) clearTimeout(leaveTimer);
            leaveTimer = null;
            openPortal();
          });
          dropdown.addEventListener("mouseleave", function(e) {
            if (portalWrapper && e.relatedTarget && portalWrapper.contains(e.relatedTarget)) return;
            leaveTimer = setTimeout(closePortal, 120);
          });
        });
      });
    },
    init(root) {
      const scope = root || document;
      if (scope.closest && scope.closest("[data-bb-disable]")) return;
      const elements = scope.querySelectorAll(bbContents._attrSelector("marquee"));
      const self = this;
      elements.forEach(function(element) {
        if (element.hasAttribute("data-bb-marquee-processed")) return;
        element.setAttribute("data-bb-marquee-processed", "true");
        const speed = bbContents._getAttr(element, "bb-marquee-speed") || "100";
        const direction = bbContents._getAttr(element, "bb-marquee-direction") || "left";
        const pauseOnHover = bbContents._getAttr(element, "bb-marquee-pause") || "true";
        const gap = bbContents._getAttr(element, "bb-marquee-gap") || "50";
        const orientation = bbContents._getAttr(element, "bb-marquee-orientation") || "horizontal";
        const height = bbContents._getAttr(element, "bb-marquee-height") || "300";
        const minHeight = bbContents._getAttr(element, "bb-marquee-min-height");
        const isMobileMarquee = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const originalHTML = element.innerHTML;
        const mainContainer = document.createElement("div");
        const isVertical = orientation === "vertical";
        const useAutoHeight = isVertical && height === "auto";
        const parentComputedStyle = getComputedStyle(element);
        const parentOverflow = parentComputedStyle.overflow;
        const parentOverflowX = parentComputedStyle.overflowX;
        const parentOverflowY = parentComputedStyle.overflowY;
        const isParentOverflowVisible = (parentOverflow === "visible" || parentOverflow === "") && (parentOverflowX === "visible" || parentOverflowX === "") && (parentOverflowY === "visible" || parentOverflowY === "");
        const mainContainerOverflow = isParentOverflowVisible ? "visible" : "hidden";
        mainContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: ${isVertical ? height === "auto" ? "auto" : height + "px" : "auto"};
                overflow: ${mainContainerOverflow};
                min-height: auto;
                ${minHeight ? `min-height: ${minHeight};` : ""}
            `;
        const scrollContainer = document.createElement("div");
        const useRelativeForHorizontal = !isVertical;
        scrollContainer.style.cssText = `
                ${useAutoHeight || useRelativeForHorizontal ? "position: relative;" : "position: absolute;"}
                will-change: transform;
                ${useAutoHeight || useRelativeForHorizontal ? "" : "height: 100%; top: 0px; left: 0px;"}
                display: flex;
                ${isVertical ? "flex-direction: column;" : ""}
                align-items: center;
                gap: ${gap}px;
                ${isVertical ? "" : "white-space: nowrap;"}
                flex-shrink: 0;
            `;
        const mainBlock = document.createElement("div");
        mainBlock.innerHTML = originalHTML;
        const hasDropdowns = self._hasDropdownInBlock(mainBlock);
        if (hasDropdowns) {
          mainContainer.style.overflow = "visible";
          scrollContainer.style.overflow = "visible";
        }
        const preloadAllImagesFirst = function(block) {
          return new Promise(function(resolve) {
            const images = block.querySelectorAll("img");
            if (images.length === 0) {
              resolve();
              return;
            }
            let loadedCount = 0;
            let errorCount = 0;
            const totalImages = images.length;
            const checkComplete = function() {
              if (loadedCount + errorCount >= totalImages) resolve();
            };
            images.forEach(function(img) {
              if (img.dataset.src && !img.src) img.src = img.dataset.src;
              if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                loadedCount++;
                checkComplete();
              } else {
                const preloadImg = new Image();
                preloadImg.onload = function() {
                  if (img.src) img.src = img.src;
                  let domAttempts = 0;
                  const checkDomImage = function() {
                    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                      loadedCount++;
                      checkComplete();
                    } else if (++domAttempts < 200) {
                      setTimeout(checkDomImage, 10);
                    } else {
                      errorCount++;
                      checkComplete();
                    }
                  };
                  setTimeout(checkDomImage, 10);
                };
                preloadImg.onerror = function() {
                  errorCount++;
                  checkComplete();
                };
                if (img.src) {
                  preloadImg.src = img.src;
                } else if (img.dataset.src) {
                  preloadImg.src = img.dataset.src;
                } else {
                  errorCount++;
                  checkComplete();
                }
                img.onload = function() {
                  if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    loadedCount++;
                    checkComplete();
                  }
                };
                if (img.src) img.src = img.src;
              }
            });
            setTimeout(function() {
              if (loadedCount + errorCount < totalImages) {
                errorCount = totalImages - loadedCount;
                checkComplete();
              }
            }, isMobileMarquee ? 1500 : 5e3);
          });
        };
        if (!isVertical) {
          setTimeout(function() {
            let marqueeItems = mainBlock.querySelectorAll('.bb-marquee_item, [role="listitem"]');
            if (marqueeItems.length === 0) marqueeItems = mainBlock.querySelectorAll(":scope > *");
            marqueeItems.forEach(function(item) {
              const computedStyle = getComputedStyle(item);
              const itemWidth = computedStyle.width;
              if (itemWidth && itemWidth !== "auto" && itemWidth !== "0px") {
                item.style.minWidth = itemWidth;
                item.style.width = itemWidth;
              }
              const textContainers = item.querySelectorAll('.use-case_client, .testimonial_client-info, [class*="text"], p, span');
              textContainers.forEach(function(container) {
                const containerStyle = container.getAttribute("style");
                const shouldPreserveAuto = container.classList.contains("tag-m") || container.classList.contains("tag") || container.classList.contains("badge") || containerStyle && containerStyle.includes("width");
                if (shouldPreserveAuto) return;
                const hasInlineWidth = container.style.width && container.style.width !== "";
                if (hasInlineWidth) return;
                const isTextContainer = container.classList.contains("use-case_client") || container.classList.contains("testimonial_client-info") || container.tagName === "P" && !container.classList.contains("tag");
                if (isTextContainer) {
                  const containerComputed = getComputedStyle(container);
                  if (!containerComputed.width || containerComputed.width === "auto" || containerComputed.width === "0px") {
                    container.style.width = "100%";
                  }
                  container.style.whiteSpace = "normal";
                  container.style.wordWrap = "break-word";
                  container.style.overflowWrap = "break-word";
                }
              });
            });
          }, 0);
        }
        mainBlock.style.cssText = `
                display: flex;
                ${isVertical ? "flex-direction: column;" : ""}
                align-items: center;
                gap: ${gap}px;
                ${isVertical ? "" : "white-space: nowrap;"}
                flex-shrink: 0;
                ${isVertical ? "min-height: 100px;" : ""}
            `;
        preloadAllImagesFirst(mainBlock).then(function() {
          const repeatBlock1 = mainBlock.cloneNode(true);
          const repeatBlock2 = mainBlock.cloneNode(true);
          const forceImagesDisplay = function(block) {
            block.querySelectorAll("img").forEach(function(img) {
              if (img.dataset.src && !img.src) img.src = img.dataset.src;
              if (img.src) {
                img.src = img.src;
                img.style.opacity = "1";
                img.style.visibility = "visible";
                void img.offsetHeight;
              }
            });
          };
          forceImagesDisplay(repeatBlock1);
          forceImagesDisplay(repeatBlock2);
          const tempContainer = document.createElement("div");
          tempContainer.style.cssText = "position: absolute; left: -9999px; top: -9999px; visibility: hidden;";
          tempContainer.appendChild(repeatBlock1);
          tempContainer.appendChild(repeatBlock2);
          if (!isMobileMarquee) document.body.appendChild(tempContainer);
          const waitForImagesRender = function(block) {
            return new Promise(function(resolve) {
              const images = block.querySelectorAll("img");
              if (images.length === 0) {
                resolve();
                return;
              }
              let renderedCount = 0;
              const totalImages = images.length;
              const checkRendered = function() {
                if (renderedCount >= totalImages) resolve();
              };
              images.forEach(function(img) {
                let renderAttempts = 0;
                const checkImage = function() {
                  if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0 && img.offsetWidth > 0) {
                    renderedCount++;
                    checkRendered();
                  } else if (++renderAttempts < 200) {
                    setTimeout(checkImage, 10);
                  } else {
                    renderedCount++;
                    checkRendered();
                  }
                };
                if (img.dataset.src && !img.src) img.src = img.dataset.src;
                if (img.complete && img.naturalWidth > 0 && img.offsetWidth > 0) {
                  renderedCount++;
                  checkRendered();
                } else {
                  img.onload = function() {
                    setTimeout(checkImage, 10);
                  };
                  checkImage();
                }
              });
              setTimeout(function() {
                if (renderedCount < totalImages) {
                  renderedCount = totalImages;
                  checkRendered();
                }
              }, isMobileMarquee ? 500 : 2e3);
            });
          };
          const forceFullRender = function() {
            return new Promise(function(resolve) {
              const totalWidth = Math.max(
                repeatBlock1.offsetWidth || 0,
                repeatBlock2.offsetWidth || 0
              );
              if (totalWidth > 0 && totalWidth > window.innerWidth) {
                tempContainer.style.left = "0px";
                tempContainer.style.width = totalWidth + "px";
                tempContainer.style.overflow = "visible";
                void tempContainer.offsetWidth;
                const translateXEnd = Math.max(0, totalWidth - window.innerWidth);
                tempContainer.style.transform = "translateX(-" + translateXEnd + "px)";
                void tempContainer.offsetWidth;
                requestAnimationFrame(function() {
                  tempContainer.style.transform = "translateX(-0px)";
                  void tempContainer.offsetWidth;
                  requestAnimationFrame(function() {
                    tempContainer.style.transform = "";
                    tempContainer.style.left = "-9999px";
                    tempContainer.style.width = "auto";
                    void tempContainer.offsetWidth;
                    requestAnimationFrame(function() {
                      requestAnimationFrame(resolve);
                    });
                  });
                });
              } else {
                requestAnimationFrame(function() {
                  requestAnimationFrame(resolve);
                });
              }
            });
          };
          const doFinish = function() {
            if (tempContainer && tempContainer.parentNode === document.body) {
              document.body.removeChild(tempContainer);
            }
            scrollContainer.appendChild(mainBlock);
            scrollContainer.appendChild(repeatBlock1);
            scrollContainer.appendChild(repeatBlock2);
            mainContainer.appendChild(scrollContainer);
            if (!isVertical) {
              requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                  let items = mainBlock.querySelectorAll('.bb-marquee_item, [role="listitem"]');
                  if (items.length === 0) items = mainBlock.querySelectorAll(":scope > *");
                  let maxHeight = 0;
                  items.forEach(function(item) {
                    const itemHeight = item.offsetHeight;
                    if (itemHeight > maxHeight) maxHeight = itemHeight;
                  });
                  if (maxHeight === 0) maxHeight = mainBlock.offsetHeight || scrollContainer.offsetHeight;
                  if (maxHeight > 0) mainContainer.style.height = maxHeight + "px";
                  if (hasDropdowns) {
                    self._enableMarqueeDropdowns(mainBlock);
                    self._enableMarqueeDropdowns(repeatBlock1);
                    self._enableMarqueeDropdowns(repeatBlock2);
                  }
                });
              });
            } else {
              if (hasDropdowns) {
                self._enableMarqueeDropdowns(mainBlock);
                self._enableMarqueeDropdowns(repeatBlock1);
                self._enableMarqueeDropdowns(repeatBlock2);
              }
            }
            element.innerHTML = "";
            element.appendChild(mainContainer);
            element.setAttribute("data-bb-marquee-processed", "true");
            requestAnimationFrame(function() {
              requestAnimationFrame(function() {
                const initDelay = isVertical ? 500 : 100;
                setTimeout(function() {
                  self.initAnimation(element, scrollContainer, mainBlock, {
                    speed,
                    direction,
                    pauseOnHover,
                    gap,
                    isVertical,
                    useAutoHeight
                  });
                }, initDelay);
              });
            });
          };
          if (isMobileMarquee) {
            requestAnimationFrame(function() {
              requestAnimationFrame(doFinish);
            });
          } else {
            Promise.all([
              waitForImagesRender(repeatBlock1),
              waitForImagesRender(repeatBlock2),
              forceFullRender()
            ]).then(doFinish);
          }
        }).catch(function() {
          const repeatBlock1 = mainBlock.cloneNode(true);
          const repeatBlock2 = mainBlock.cloneNode(true);
          scrollContainer.appendChild(mainBlock);
          scrollContainer.appendChild(repeatBlock1);
          scrollContainer.appendChild(repeatBlock2);
          mainContainer.appendChild(scrollContainer);
          element.innerHTML = "";
          element.appendChild(mainContainer);
          element.setAttribute("data-bb-marquee-processed", "true");
          if (hasDropdowns) {
            self._enableMarqueeDropdowns(mainBlock);
            self._enableMarqueeDropdowns(repeatBlock1);
            self._enableMarqueeDropdowns(repeatBlock2);
          }
          const initDelay = isVertical ? 500 : 300;
          setTimeout(function() {
            self.initAnimation(element, scrollContainer, mainBlock, {
              speed,
              direction,
              pauseOnHover,
              gap,
              isVertical,
              useAutoHeight
            });
          }, initDelay);
        });
      });
      bbContents.utils.log("Module Marquee initialis\xE9:", elements.length, "\xE9l\xE9ments");
    },
    initAnimation(element, scrollContainer, mainBlock, options) {
      const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight } = options;
      const contentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;
      if (contentSize === 0) {
        element._marqueeInitRetry = (element._marqueeInitRetry || 0) + 1;
        if (element._marqueeInitRetry <= 50 && element.isConnected) {
          setTimeout(() => this.initAnimation(element, scrollContainer, mainBlock, options), 200);
        }
        return;
      }
      const minSize = isVertical ? 50 : 100;
      if (contentSize > 0 && contentSize < minSize && !element._marqueeSizeRetry) {
        element._marqueeSizeRetry = true;
        setTimeout(() => this.initAnimation(element, scrollContainer, mainBlock, options), 100);
        return;
      }
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const gapSize = parseInt(gap);
      const step = parseFloat(speed) * (isVertical ? 1.5 : 0.8) / 60;
      if (isSafari) {
        this.initSafariAnimation(element, scrollContainer, mainBlock, {
          speed,
          direction,
          gap,
          isVertical,
          useAutoHeight,
          contentSize,
          gapSize
        });
      } else {
        const hasCopies = scrollContainer.children.length >= 3;
        if (!hasCopies) {
          const repeatBlock1 = mainBlock.cloneNode(true);
          const repeatBlock2 = mainBlock.cloneNode(true);
          const preloadImagesInBlockSync = function(block) {
            block.querySelectorAll("img").forEach(function(img) {
              if (img.dataset.src && !img.src) img.src = img.dataset.src;
              if (img.src) {
                const preloadImg = new Image();
                preloadImg.src = img.src;
                if (!img.complete) img.src = img.src;
              }
            });
          };
          preloadImagesInBlockSync(repeatBlock1);
          preloadImagesInBlockSync(repeatBlock2);
          scrollContainer.appendChild(repeatBlock1);
          scrollContainer.appendChild(repeatBlock2);
        }
        this.initStandardAnimation(element, scrollContainer, mainBlock, {
          speed,
          direction,
          pauseOnHover,
          gap,
          isVertical,
          useAutoHeight,
          contentSize,
          gapSize,
          step
        });
      }
    },
    initSafariAnimation(element, scrollContainer, mainBlock, options) {
      const { speed, direction, gap, isVertical, useAutoHeight, contentSize, gapSize } = options;
      const images = mainBlock.querySelectorAll("img");
      let imagesLoaded = 0;
      const totalImages = images.length;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod/.test(navigator.userAgent);
      images.forEach(function(img) {
        if (img.dataset.src && !img.src) {
          img.src = img.dataset.src;
          img.loading = "eager";
        }
        const isSVG = img.src && (img.src.toLowerCase().endsWith(".svg") || img.src.includes("data:image/svg+xml"));
        const originalObjectFit = img.style.objectFit || getComputedStyle(img).objectFit;
        const originalObjectPosition = img.style.objectPosition || getComputedStyle(img).objectPosition;
        const originalWidth = img.style.width;
        const originalHeight = img.style.height;
        img.onload = function() {
          if (isSVG && isSafari) {
            img.style.objectFit = "contain";
            img.style.objectPosition = "center";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.boxSizing = "border-box";
            img.style.imageRendering = "auto";
            img.style.webkitBackfaceVisibility = "hidden";
            img.style.backfaceVisibility = "hidden";
            img.style.webkitTransform = "translateZ(0)";
            img.style.transform = "translateZ(0)";
            const parent = img.parentElement;
            if (parent) {
              const parentStyles = getComputedStyle(parent);
              const hasParentWidth = parentStyles.width && parentStyles.width !== "auto" && parentStyles.width !== "0px";
              const hasParentHeight = parentStyles.height && parentStyles.height !== "auto" && parentStyles.height !== "0px";
              parent.style.display = "flex";
              parent.style.alignItems = "center";
              parent.style.justifyContent = "center";
              parent.style.overflow = "hidden";
              parent.style.boxSizing = "border-box";
              if (!hasParentWidth && !parent.style.width) parent.style.width = "100%";
              if (!hasParentHeight && !parent.style.height) parent.style.height = "100%";
            }
          } else if (isSVG && isMobile) {
            img.style.objectFit = "contain";
            img.style.objectPosition = "center";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.boxSizing = "border-box";
            const parent = img.parentElement;
            if (parent) {
              parent.style.display = "flex";
              parent.style.alignItems = "center";
              parent.style.justifyContent = "center";
              parent.style.overflow = "hidden";
              parent.style.boxSizing = "border-box";
            }
          } else if (isSafari) {
            if (originalObjectFit && originalObjectFit !== "none") img.style.objectFit = originalObjectFit;
            if (originalObjectPosition && originalObjectPosition !== "initial") img.style.objectPosition = originalObjectPosition;
            if (!originalWidth || originalWidth === "") img.style.width = "auto";
            if (!originalHeight || originalHeight === "") img.style.height = "auto";
            img.style.webkitBackfaceVisibility = "hidden";
            img.style.backfaceVisibility = "hidden";
            img.style.webkitTransform = "translateZ(0)";
            img.style.transform = "translateZ(0)";
            const parent = img.parentElement;
            if (parent) {
              parent.style.overflow = "hidden";
              parent.style.boxSizing = "border-box";
            }
          } else {
            if (originalObjectFit && originalObjectFit !== "none") img.style.objectFit = originalObjectFit;
            if (originalObjectPosition && originalObjectPosition !== "initial") img.style.objectPosition = originalObjectPosition;
            if (!originalWidth || originalWidth === "") img.style.width = "auto";
            if (!originalHeight || originalHeight === "") img.style.height = "auto";
          }
          imagesLoaded++;
        };
        img.onerror = function() {
          imagesLoaded++;
        };
        if (img.complete && img.naturalWidth > 0) imagesLoaded++;
      });
      let maxWaitTime = isMobile ? 1500 : 3e3;
      if (isSafari) maxWaitTime = Math.min(maxWaitTime, 600);
      let waitTimeout = 0;
      const startSafariAnimation = () => {
        if (waitTimeout >= maxWaitTime && imagesLoaded < totalImages) {
          images.forEach(function(img) {
            if (img.dataset.src && !img.src) {
              img.src = img.dataset.src;
              img.loading = "eager";
            }
          });
        }
        const newContentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;
        let finalContentSize = newContentSize > contentSize ? newContentSize : contentSize;
        if (finalContentSize < 200) {
          const parentElement = element.parentElement;
          if (parentElement) {
            finalContentSize = isVertical ? parentElement.offsetHeight : parentElement.offsetWidth;
          }
          if (finalContentSize < 200) {
            finalContentSize = isVertical ? isMobile ? 600 : 400 : isMobile ? 1e3 : 800;
          }
        }
        const totalSize = finalContentSize * 3 + gapSize * 2;
        const step = parseFloat(speed) * (isVertical ? 1.5 : 0.8) / 60;
        let isPaused = false;
        if (isSafari && isMobile) {
          scrollContainer.style.willChange = "transform";
          scrollContainer.style.webkitBackfaceVisibility = "hidden";
          scrollContainer.style.backfaceVisibility = "hidden";
        }
        if (isVertical && !useAutoHeight) {
          scrollContainer.style.height = totalSize + "px";
        } else if (!isVertical) {
          scrollContainer.style.width = totalSize + "px";
        }
        let currentPosition = -(finalContentSize + gapSize);
        const initialTransform = isVertical ? `translate3d(0, ${currentPosition}px, 0)` : `translate3d(${currentPosition}px, 0, 0)`;
        scrollContainer.style.transform = initialTransform;
        if (isSafari && isMobile) void scrollContainer.offsetHeight;
        let lastTime = performance.now();
        const animate = (currentTime) => {
          if (!element.isConnected) return;
          const dropdownOpen = element.getAttribute("data-bb-marquee-dropdown-open") === "1";
          if (!isPaused && !dropdownOpen) {
            const deltaTime = isSafari && isMobile ? (currentTime - lastTime) / 16.67 : 1;
            lastTime = currentTime;
            if (direction === (isVertical ? "bottom" : "right")) {
              currentPosition += step * deltaTime;
              const resetThreshold = -(0.2 * (finalContentSize + gapSize));
              if (currentPosition >= resetThreshold) {
                currentPosition = currentPosition - (finalContentSize + gapSize);
              }
            } else {
              currentPosition -= step * deltaTime;
              const resetThreshold = -(1.8 * (finalContentSize + gapSize));
              if (currentPosition <= resetThreshold) {
                currentPosition = currentPosition + (finalContentSize + gapSize);
              }
            }
            currentPosition = Math.round(currentPosition * 100) / 100;
            const transform = isVertical ? `translate3d(0, ${currentPosition}px, 0)` : `translate3d(${currentPosition}px, 0, 0)`;
            scrollContainer.style.transform = transform;
          }
          requestAnimationFrame(animate);
        };
        if (isSafari && isMobile) {
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              lastTime = performance.now();
              animate(lastTime);
            });
          });
        } else {
          setTimeout(function() {
            lastTime = performance.now();
            animate(lastTime);
          }, 50);
        }
        if (element.getAttribute("bb-marquee-pause") === "true") {
          element.addEventListener("mouseenter", function() {
            isPaused = true;
          });
          element.addEventListener("mouseleave", function() {
            isPaused = false;
          });
        }
      };
      const waitForImages = () => {
        waitTimeout += 100;
        if (totalImages === 0) {
          const renderDelay = isMobile ? 500 : 100;
          setTimeout(startSafariAnimation, renderDelay);
        } else if (imagesLoaded >= totalImages) {
          const renderDelay = isSafari && isMobile ? 80 : isMobile ? 500 : 200;
          setTimeout(startSafariAnimation, renderDelay);
        } else if (waitTimeout >= maxWaitTime) {
          const renderDelay = isSafari && isMobile ? 80 : isMobile ? 500 : 200;
          setTimeout(startSafariAnimation, renderDelay);
        } else {
          setTimeout(waitForImages, 100);
        }
      };
      if (imagesLoaded >= totalImages) {
        const renderDelay = isSafari && isMobile ? 80 : isMobile ? 500 : 200;
        setTimeout(startSafariAnimation, renderDelay);
      } else {
        waitForImages();
      }
    },
    initStandardAnimation(element, scrollContainer, mainBlock, options) {
      const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight, contentSize, gapSize, step } = options;
      const totalSize = contentSize * 3 + gapSize * 2;
      let isPaused = false;
      let currentPosition = -(contentSize + gapSize);
      if (isVertical && !useAutoHeight) {
        scrollContainer.style.height = totalSize + "px";
      } else if (!isVertical) {
        scrollContainer.style.width = totalSize + "px";
      }
      let lastTime = performance.now();
      const animate = (currentTime) => {
        if (!element.isConnected) return;
        const dropdownOpen = element.getAttribute("data-bb-marquee-dropdown-open") === "1";
        if (!isPaused && !dropdownOpen) {
          const deltaTime = (currentTime - lastTime) / 16.67;
          lastTime = currentTime;
          const clampedDelta = Math.min(deltaTime, 2);
          if (direction === (isVertical ? "bottom" : "right")) {
            currentPosition += step * clampedDelta;
            const resetThreshold = -(0.2 * (contentSize + gapSize));
            if (currentPosition >= resetThreshold) {
              currentPosition = currentPosition - (contentSize + gapSize);
            }
          } else {
            currentPosition -= step * clampedDelta;
            const resetThreshold = -(1.8 * (contentSize + gapSize));
            if (currentPosition <= resetThreshold) {
              currentPosition = currentPosition + (contentSize + gapSize);
            }
          }
          currentPosition = Math.round(currentPosition * 100) / 100;
          const transform = isVertical ? `translate3d(0, ${currentPosition}px, 0)` : `translate3d(${currentPosition}px, 0, 0)`;
          scrollContainer.style.transform = transform;
        }
        requestAnimationFrame(animate);
      };
      lastTime = performance.now();
      requestAnimationFrame(animate);
      if (pauseOnHover === "true") {
        element.addEventListener("mouseenter", function() {
          isPaused = true;
        });
        element.addEventListener("mouseleave", function() {
          isPaused = false;
        });
      }
    }
  };
  var marquee_default = marquee;

  // src/modules/share.js
  var share_default = {
    networks: {
      twitter: (data) => "https://twitter.com/intent/tweet?url=" + encodeURIComponent(data.url) + "&text=" + encodeURIComponent(data.text),
      facebook: (data) => "https://facebook.com/sharer/sharer.php?u=" + encodeURIComponent(data.url),
      linkedin: (data) => "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(data.url),
      whatsapp: (data) => "https://wa.me/?text=" + encodeURIComponent(data.text + " " + data.url),
      telegram: (data) => "https://t.me/share/url?url=" + encodeURIComponent(data.url) + "&text=" + encodeURIComponent(data.text),
      email: (data) => "mailto:?subject=" + encodeURIComponent(data.text) + "&body=" + encodeURIComponent(data.text + " " + data.url),
      copy: (data) => "copy:" + data.url,
      native: (data) => "native:" + JSON.stringify(data)
    },
    init(scope) {
      if (scope.closest && scope.closest("[data-bb-disable]")) return;
      const elements = scope.querySelectorAll(bbContents._attrSelector("share"));
      const self = this;
      elements.forEach(function(element) {
        if (element.hasAttribute("data-bb-share-processed")) return;
        element.setAttribute("data-bb-share-processed", "1");
        const network = bbContents._getAttr(element, "bb-share");
        const customUrl = bbContents._getAttr(element, "bb-url");
        const customText = bbContents._getAttr(element, "bb-text");
        const data = {
          // text is only ever percent-encoded into share URLs or passed to
          // navigator.share — never inserted as HTML — so it stays raw.
          url: bbContents.utils.isValidUrl(customUrl) ? customUrl : window.location.href,
          text: customText || document.title || "D\xE9couvrez ce site"
        };
        element.addEventListener("click", function(e) {
          e.preventDefault();
          self.share(network, data, element);
        });
        if (element.tagName !== "BUTTON" && element.tagName !== "A") {
          element.setAttribute("role", "button");
          element.setAttribute("tabindex", "0");
          element.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              self.share(network, data, element);
            }
          });
        }
        element.style.cursor = "pointer";
      });
      bbContents.utils.log("Module Share initialis\xE9:", elements.length, "\xE9l\xE9ments");
    },
    share(network, data, element) {
      const networkFunc = this.networks[network];
      if (!networkFunc) return;
      const shareUrl = networkFunc(data);
      if (shareUrl.startsWith("copy:")) {
        this.copyToClipboard(shareUrl.substring(5), element, true);
        return;
      }
      if (shareUrl.startsWith("native:")) {
        this.nativeShare(JSON.parse(shareUrl.substring(7)), element);
        return;
      }
      const width = 600, height = 400;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      window.open(
        shareUrl,
        "bbshare",
        `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
      );
    },
    copyToClipboard(text, element, silent) {
      const isSilent = !!silent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (!isSilent) {
            this.showFeedback(element, "\u2713 " + (bbContents.config.i18n.copied || "Lien copi\xE9 !"));
          }
        }).catch(() => {
          this.fallbackCopy(text, element, isSilent);
        });
      } else {
        this.fallbackCopy(text, element, isSilent);
      }
    },
    fallbackCopy(text, element, silent) {
      if (!!silent) return;
      try {
        window.prompt("Copiez le lien ci-dessous (Ctrl/Cmd+C) :", text);
      } catch (err) {
        console.error("[bb-contents] share: fallbackCopy failed:", err);
      }
    },
    nativeShare(data, element) {
      if (navigator.share) {
        navigator.share({ title: data.text, url: data.url }).catch((error) => {
          if (error.name !== "AbortError") {
            this.copyToClipboard(data.url, element, false);
          }
        });
      } else {
        this.copyToClipboard(data.url, element, false);
      }
    },
    showFeedback(element, message) {
      const originalText = element.textContent;
      element.textContent = message;
      element.style.pointerEvents = "none";
      setTimeout(() => {
        element.textContent = originalText;
        element.style.pointerEvents = "";
      }, 2e3);
    }
  };

  // src/modules/currentYear.js
  var currentYear_default = {
    init(scope) {
      if (scope.closest && scope.closest("[data-bb-disable]")) return;
      const elements = scope.querySelectorAll(bbContents._attrSelector("current-year"));
      const year = String((/* @__PURE__ */ new Date()).getFullYear());
      elements.forEach(function(element) {
        if (element.hasAttribute("data-bb-current-year-processed")) return;
        element.setAttribute("data-bb-current-year-processed", "1");
        const customFormat = bbContents._getAttr(element, "bb-current-year-format");
        const prefix = bbContents._getAttr(element, "bb-current-year-prefix") || "";
        const suffix = bbContents._getAttr(element, "bb-current-year-suffix") || "";
        if (customFormat && customFormat.includes("{year}")) {
          element.textContent = customFormat.replace("{year}", year);
        } else if (prefix || suffix) {
          element.textContent = prefix + year + suffix;
        } else {
          element.textContent = year;
        }
      });
      bbContents.utils.log("Module CurrentYear initialis\xE9:", elements.length, "\xE9l\xE9ments");
    }
  };

  // src/modules/readingTime.js
  var readingTime_default = {
    fetchContentFromUrl(url, targetSelector) {
      return fetch(url).then(function(response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      }).then(function(html) {
        const cleanedHtml = bbContents.utils.cleanHtml(html);
        const parser = new DOMParser();
        const doc = parser.parseFromString(cleanedHtml, "text/html");
        let contentNode = null;
        if (targetSelector) contentNode = doc.querySelector(targetSelector);
        if (!contentNode) {
          const contentSelectors = [
            "article",
            '[role="article"]',
            ".blog-post-content",
            ".post-content",
            ".article-content",
            ".content",
            "main article",
            "main .w-dyn-bind-empty",
            "main .w-richtext"
          ];
          for (let i = 0; i < contentSelectors.length; i++) {
            contentNode = doc.querySelector(contentSelectors[i]);
            if (contentNode) break;
          }
        }
        if (!contentNode) contentNode = doc.body;
        if (!contentNode) return { text: "", images: [] };
        const text = contentNode.textContent.trim();
        const images = contentNode.querySelectorAll("img");
        return { text, images };
      });
    },
    calculateReadingTime(text, images, wordsPerMinute, secondsPerImage) {
      const wordCount = text ? text.trim().split(/\s+/).filter(function(word) {
        return word.length > 0;
      }).length : 0;
      const imageCount = images ? images.length : 0;
      const imageTimeInMinutes = imageCount * secondsPerImage / 60;
      let minutesFloat = wordCount / wordsPerMinute + imageTimeInMinutes;
      let minutes = Math.ceil(minutesFloat);
      if ((wordCount > 0 || imageCount > 0) && minutes < 1) minutes = 1;
      if (wordCount === 0 && imageCount === 0) minutes = 0;
      return minutes;
    },
    init(root) {
      const scope = root || document;
      if (scope.closest && scope.closest("[data-bb-disable]")) return;
      const elements = scope.querySelectorAll(bbContents._attrSelector("reading-time"));
      const self = this;
      elements.forEach(function(element) {
        if (element.hasAttribute("data-bb-reading-time-processed")) return;
        element.setAttribute("data-bb-reading-time-processed", "1");
        const targetSelector = bbContents._getAttr(element, "bb-reading-time-target");
        const speedAttr = bbContents._getAttr(element, "bb-reading-time-speed");
        const imageSpeedAttr = bbContents._getAttr(element, "bb-reading-time-image-speed");
        const format = bbContents._getAttr(element, "bb-reading-time-format") || "{minutes} min";
        const urlAttr = bbContents._getAttr(element, "bb-reading-time-url");
        let wordsPerMinute = Number(speedAttr);
        if (isNaN(wordsPerMinute) || wordsPerMinute <= 0) wordsPerMinute = 230;
        let secondsPerImage = Number(imageSpeedAttr);
        if (isNaN(secondsPerImage) || secondsPerImage < 0) secondsPerImage = 12;
        let articleUrl = null;
        const linkElement = element.closest("a");
        if (linkElement && linkElement.href) articleUrl = linkElement.href;
        if (!articleUrl && urlAttr) {
          articleUrl = urlAttr;
          if (articleUrl && !bbContents.utils.isValidUrl(articleUrl)) {
            try {
              const url = new URL(articleUrl, window.location.origin);
              if (url.origin !== window.location.origin) {
                articleUrl = null;
              } else {
                articleUrl = url.href;
              }
            } catch (e) {
              articleUrl = null;
            }
          } else if (articleUrl && bbContents.utils.isValidUrl(articleUrl)) {
            try {
              const url = new URL(articleUrl);
              if (url.origin !== window.location.origin) articleUrl = null;
            } catch (e) {
              articleUrl = null;
            }
          }
        }
        let sameOriginUrl = null;
        if (articleUrl && bbContents.utils.isValidUrl(articleUrl)) {
          try {
            if (new URL(articleUrl).origin === window.location.origin) {
              sameOriginUrl = articleUrl;
            }
          } catch (e) {
            sameOriginUrl = null;
          }
        }
        if (sameOriginUrl) {
          const originalText = element.textContent;
          self.fetchContentFromUrl(sameOriginUrl, targetSelector).then(function(data) {
            const minutes2 = self.calculateReadingTime(data.text, data.images, wordsPerMinute, secondsPerImage);
            element.textContent = format.replace("{minutes}", String(minutes2));
          }).catch(function(error) {
            bbContents.utils.log("Erreur reading-time fetch:", error);
            element.textContent = originalText || "";
          });
          return;
        }
        let sourceNodes = [];
        if (targetSelector) {
          const foundNodes = document.querySelectorAll(targetSelector);
          sourceNodes = foundNodes.length === 0 ? [element] : Array.from(foundNodes);
        } else {
          sourceNodes = [element];
        }
        let totalText = "";
        let totalImages = [];
        sourceNodes.forEach(function(node) {
          const nodeText = (node.textContent || "").trim();
          if (nodeText) totalText += (totalText ? " " : "") + nodeText;
          totalImages = totalImages.concat(Array.from(node.querySelectorAll("img")));
        });
        const minutes = self.calculateReadingTime(totalText.trim(), totalImages, wordsPerMinute, secondsPerImage);
        element.textContent = format.replace("{minutes}", String(minutes));
      });
      bbContents.utils.log("Module ReadingTime initialis\xE9:", elements.length, "\xE9l\xE9ments");
    }
  };

  // src/modules/countrySelect.data.js
  var countrySelect_data_default = [
    { alpha2: "AD", alpha3: "AND", name: { fr: "Andorre", en: "Andorra" } },
    { alpha2: "AE", alpha3: "ARE", name: { fr: "\xC9mirats arabes unis", en: "United Arab Emirates" } },
    { alpha2: "AF", alpha3: "AFG", name: { fr: "Afghanistan", en: "Afghanistan" } },
    { alpha2: "AG", alpha3: "ATG", name: { fr: "Antigua-et-Barbuda", en: "Antigua and Barbuda" } },
    { alpha2: "AI", alpha3: "AIA", name: { fr: "Anguilla", en: "Anguilla" } },
    { alpha2: "AL", alpha3: "ALB", name: { fr: "Albanie", en: "Albania" } },
    { alpha2: "AM", alpha3: "ARM", name: { fr: "Arm\xE9nie", en: "Armenia" } },
    { alpha2: "AO", alpha3: "AGO", name: { fr: "Angola", en: "Angola" } },
    { alpha2: "AQ", alpha3: "ATA", name: { fr: "Antarctique", en: "Antarctica" } },
    { alpha2: "AR", alpha3: "ARG", name: { fr: "Argentine", en: "Argentina" } },
    { alpha2: "AS", alpha3: "ASM", name: { fr: "Samoa am\xE9ricaines", en: "American Samoa" } },
    { alpha2: "AT", alpha3: "AUT", name: { fr: "Autriche", en: "Austria" } },
    { alpha2: "AU", alpha3: "AUS", name: { fr: "Australie", en: "Australia" } },
    { alpha2: "AW", alpha3: "ABW", name: { fr: "Aruba", en: "Aruba" } },
    { alpha2: "AX", alpha3: "ALA", name: { fr: "\xC5land", en: "\xC5land Islands" } },
    { alpha2: "AZ", alpha3: "AZE", name: { fr: "Azerba\xEFdjan", en: "Azerbaijan" } },
    { alpha2: "BA", alpha3: "BIH", name: { fr: "Bosnie-Herz\xE9govine", en: "Bosnia and Herzegovina" } },
    { alpha2: "BB", alpha3: "BRB", name: { fr: "Barbade", en: "Barbados" } },
    { alpha2: "BD", alpha3: "BGD", name: { fr: "Bangladesh", en: "Bangladesh" } },
    { alpha2: "BE", alpha3: "BEL", name: { fr: "Belgique", en: "Belgium" } },
    { alpha2: "BF", alpha3: "BFA", name: { fr: "Burkina Faso", en: "Burkina Faso" } },
    { alpha2: "BG", alpha3: "BGR", name: { fr: "Bulgarie", en: "Bulgaria" } },
    { alpha2: "BH", alpha3: "BHR", name: { fr: "Bahre\xEFn", en: "Bahrain" } },
    { alpha2: "BI", alpha3: "BDI", name: { fr: "Burundi", en: "Burundi" } },
    { alpha2: "BJ", alpha3: "BEN", name: { fr: "B\xE9nin", en: "Benin" } },
    { alpha2: "BL", alpha3: "BLM", name: { fr: "Saint-Barth\xE9lemy", en: "Saint Barth\xE9lemy" } },
    { alpha2: "BM", alpha3: "BMU", name: { fr: "Bermudes", en: "Bermuda" } },
    { alpha2: "BN", alpha3: "BRN", name: { fr: "Brunei", en: "Brunei" } },
    { alpha2: "BO", alpha3: "BOL", name: { fr: "Bolivie", en: "Bolivia" } },
    { alpha2: "BQ", alpha3: "BES", name: { fr: "Pays-Bas carib\xE9ens", en: "Caribbean Netherlands" } },
    { alpha2: "BR", alpha3: "BRA", name: { fr: "Br\xE9sil", en: "Brazil" } },
    { alpha2: "BS", alpha3: "BHS", name: { fr: "Bahamas", en: "Bahamas" } },
    { alpha2: "BT", alpha3: "BTN", name: { fr: "Bhoutan", en: "Bhutan" } },
    { alpha2: "BV", alpha3: "BVT", name: { fr: "\xCEle Bouvet", en: "Bouvet Island" } },
    { alpha2: "BW", alpha3: "BWA", name: { fr: "Botswana", en: "Botswana" } },
    { alpha2: "BY", alpha3: "BLR", name: { fr: "Bi\xE9lorussie", en: "Belarus" } },
    { alpha2: "BZ", alpha3: "BLZ", name: { fr: "Belize", en: "Belize" } },
    { alpha2: "CA", alpha3: "CAN", name: { fr: "Canada", en: "Canada" } },
    { alpha2: "CC", alpha3: "CCK", name: { fr: "\xCEles Cocos", en: "Cocos Islands" } },
    { alpha2: "CD", alpha3: "COD", name: { fr: "R\xE9publique d\xE9mocratique du Congo", en: "Democratic Republic of the Congo" } },
    { alpha2: "CF", alpha3: "CAF", name: { fr: "R\xE9publique centrafricaine", en: "Central African Republic" } },
    { alpha2: "CG", alpha3: "COG", name: { fr: "Congo", en: "Republic of the Congo" } },
    { alpha2: "CH", alpha3: "CHE", name: { fr: "Suisse", en: "Switzerland" } },
    { alpha2: "CI", alpha3: "CIV", name: { fr: "C\xF4te d'Ivoire", en: "Ivory Coast" } },
    { alpha2: "CK", alpha3: "COK", name: { fr: "\xCEles Cook", en: "Cook Islands" } },
    { alpha2: "CL", alpha3: "CHL", name: { fr: "Chili", en: "Chile" } },
    { alpha2: "CM", alpha3: "CMR", name: { fr: "Cameroun", en: "Cameroon" } },
    { alpha2: "CN", alpha3: "CHN", name: { fr: "Chine", en: "China" } },
    { alpha2: "CO", alpha3: "COL", name: { fr: "Colombie", en: "Colombia" } },
    { alpha2: "CR", alpha3: "CRI", name: { fr: "Costa Rica", en: "Costa Rica" } },
    { alpha2: "CU", alpha3: "CUB", name: { fr: "Cuba", en: "Cuba" } },
    { alpha2: "CV", alpha3: "CPV", name: { fr: "Cap-Vert", en: "Cape Verde" } },
    { alpha2: "CW", alpha3: "CUW", name: { fr: "Cura\xE7ao", en: "Cura\xE7ao" } },
    { alpha2: "CX", alpha3: "CXR", name: { fr: "\xCEle Christmas", en: "Christmas Island" } },
    { alpha2: "CY", alpha3: "CYP", name: { fr: "Chypre", en: "Cyprus" } },
    { alpha2: "CZ", alpha3: "CZE", name: { fr: "Tch\xE9quie", en: "Czechia" } },
    { alpha2: "DE", alpha3: "DEU", name: { fr: "Allemagne", en: "Germany" } },
    { alpha2: "DJ", alpha3: "DJI", name: { fr: "Djibouti", en: "Djibouti" } },
    { alpha2: "DK", alpha3: "DNK", name: { fr: "Danemark", en: "Denmark" } },
    { alpha2: "DM", alpha3: "DMA", name: { fr: "Dominique", en: "Dominica" } },
    { alpha2: "DO", alpha3: "DOM", name: { fr: "R\xE9publique dominicaine", en: "Dominican Republic" } },
    { alpha2: "DZ", alpha3: "DZA", name: { fr: "Alg\xE9rie", en: "Algeria" } },
    { alpha2: "EC", alpha3: "ECU", name: { fr: "\xC9quateur", en: "Ecuador" } },
    { alpha2: "EE", alpha3: "EST", name: { fr: "Estonie", en: "Estonia" } },
    { alpha2: "EG", alpha3: "EGY", name: { fr: "\xC9gypte", en: "Egypt" } },
    { alpha2: "EH", alpha3: "ESH", name: { fr: "Sahara occidental", en: "Western Sahara" } },
    { alpha2: "ER", alpha3: "ERI", name: { fr: "\xC9rythr\xE9e", en: "Eritrea" } },
    { alpha2: "ES", alpha3: "ESP", name: { fr: "Espagne", en: "Spain" } },
    { alpha2: "ET", alpha3: "ETH", name: { fr: "\xC9thiopie", en: "Ethiopia" } },
    { alpha2: "FI", alpha3: "FIN", name: { fr: "Finlande", en: "Finland" } },
    { alpha2: "FJ", alpha3: "FJI", name: { fr: "Fidji", en: "Fiji" } },
    { alpha2: "FK", alpha3: "FLK", name: { fr: "\xCEles Malouines", en: "Falkland Islands" } },
    { alpha2: "FM", alpha3: "FSM", name: { fr: "Micron\xE9sie", en: "Micronesia" } },
    { alpha2: "FO", alpha3: "FRO", name: { fr: "\xCEles F\xE9ro\xE9", en: "Faroe Islands" } },
    { alpha2: "FR", alpha3: "FRA", name: { fr: "France", en: "France" } },
    { alpha2: "GA", alpha3: "GAB", name: { fr: "Gabon", en: "Gabon" } },
    { alpha2: "GB", alpha3: "GBR", name: { fr: "Royaume-Uni", en: "United Kingdom" } },
    { alpha2: "GD", alpha3: "GRD", name: { fr: "Grenade", en: "Grenada" } },
    { alpha2: "GE", alpha3: "GEO", name: { fr: "G\xE9orgie", en: "Georgia" } },
    { alpha2: "GF", alpha3: "GUF", name: { fr: "Guyane fran\xE7aise", en: "French Guiana" } },
    { alpha2: "GG", alpha3: "GGY", name: { fr: "Guernesey", en: "Guernsey" } },
    { alpha2: "GH", alpha3: "GHA", name: { fr: "Ghana", en: "Ghana" } },
    { alpha2: "GI", alpha3: "GIB", name: { fr: "Gibraltar", en: "Gibraltar" } },
    { alpha2: "GL", alpha3: "GRL", name: { fr: "Groenland", en: "Greenland" } },
    { alpha2: "GM", alpha3: "GMB", name: { fr: "Gambie", en: "Gambia" } },
    { alpha2: "GN", alpha3: "GIN", name: { fr: "Guin\xE9e", en: "Guinea" } },
    { alpha2: "GP", alpha3: "GLP", name: { fr: "Guadeloupe", en: "Guadeloupe" } },
    { alpha2: "GQ", alpha3: "GNQ", name: { fr: "Guin\xE9e \xE9quatoriale", en: "Equatorial Guinea" } },
    { alpha2: "GR", alpha3: "GRC", name: { fr: "Gr\xE8ce", en: "Greece" } },
    { alpha2: "GS", alpha3: "SGS", name: { fr: "G\xE9orgie du Sud-et-les \xCEles Sandwich du Sud", en: "South Georgia and the South Sandwich Islands" } },
    { alpha2: "GT", alpha3: "GTM", name: { fr: "Guatemala", en: "Guatemala" } },
    { alpha2: "GU", alpha3: "GUM", name: { fr: "Guam", en: "Guam" } },
    { alpha2: "GW", alpha3: "GNB", name: { fr: "Guin\xE9e-Bissau", en: "Guinea-Bissau" } },
    { alpha2: "GY", alpha3: "GUY", name: { fr: "Guyane", en: "Guyana" } },
    { alpha2: "HK", alpha3: "HKG", name: { fr: "Hong Kong", en: "Hong Kong" } },
    { alpha2: "HM", alpha3: "HMD", name: { fr: "\xCEles Heard-et-MacDonald", en: "Heard Island and McDonald Islands" } },
    { alpha2: "HN", alpha3: "HND", name: { fr: "Honduras", en: "Honduras" } },
    { alpha2: "HR", alpha3: "HRV", name: { fr: "Croatie", en: "Croatia" } },
    { alpha2: "HT", alpha3: "HTI", name: { fr: "Ha\xEFti", en: "Haiti" } },
    { alpha2: "HU", alpha3: "HUN", name: { fr: "Hongrie", en: "Hungary" } },
    { alpha2: "ID", alpha3: "IDN", name: { fr: "Indon\xE9sie", en: "Indonesia" } },
    { alpha2: "IE", alpha3: "IRL", name: { fr: "Irlande", en: "Ireland" } },
    { alpha2: "IL", alpha3: "ISR", name: { fr: "Isra\xEBl", en: "Israel" } },
    { alpha2: "IM", alpha3: "IMN", name: { fr: "\xCEle de Man", en: "Isle of Man" } },
    { alpha2: "IN", alpha3: "IND", name: { fr: "Inde", en: "India" } },
    { alpha2: "IO", alpha3: "IOT", name: { fr: "Territoire britannique de l'oc\xE9an Indien", en: "British Indian Ocean Territory" } },
    { alpha2: "IQ", alpha3: "IRQ", name: { fr: "Irak", en: "Iraq" } },
    { alpha2: "IR", alpha3: "IRN", name: { fr: "Iran", en: "Iran" } },
    { alpha2: "IS", alpha3: "ISL", name: { fr: "Islande", en: "Iceland" } },
    { alpha2: "IT", alpha3: "ITA", name: { fr: "Italie", en: "Italy" } },
    { alpha2: "JE", alpha3: "JEY", name: { fr: "Jersey", en: "Jersey" } },
    { alpha2: "JM", alpha3: "JAM", name: { fr: "Jama\xEFque", en: "Jamaica" } },
    { alpha2: "JO", alpha3: "JOR", name: { fr: "Jordanie", en: "Jordan" } },
    { alpha2: "JP", alpha3: "JPN", name: { fr: "Japon", en: "Japan" } },
    { alpha2: "KE", alpha3: "KEN", name: { fr: "Kenya", en: "Kenya" } },
    { alpha2: "KG", alpha3: "KGZ", name: { fr: "Kirghizistan", en: "Kyrgyzstan" } },
    { alpha2: "KH", alpha3: "KHM", name: { fr: "Cambodge", en: "Cambodia" } },
    { alpha2: "KI", alpha3: "KIR", name: { fr: "Kiribati", en: "Kiribati" } },
    { alpha2: "KM", alpha3: "COM", name: { fr: "Comores", en: "Comoros" } },
    { alpha2: "KN", alpha3: "KNA", name: { fr: "Saint-Kitts-et-Nevis", en: "Saint Kitts and Nevis" } },
    { alpha2: "KP", alpha3: "PRK", name: { fr: "Cor\xE9e du Nord", en: "North Korea" } },
    { alpha2: "KR", alpha3: "KOR", name: { fr: "Cor\xE9e du Sud", en: "South Korea" } },
    { alpha2: "KW", alpha3: "KWT", name: { fr: "Kowe\xEFt", en: "Kuwait" } },
    { alpha2: "KY", alpha3: "CYM", name: { fr: "\xCEles Ca\xEFmans", en: "Cayman Islands" } },
    { alpha2: "KZ", alpha3: "KAZ", name: { fr: "Kazakhstan", en: "Kazakhstan" } },
    { alpha2: "LA", alpha3: "LAO", name: { fr: "Laos", en: "Laos" } },
    { alpha2: "LB", alpha3: "LBN", name: { fr: "Liban", en: "Lebanon" } },
    { alpha2: "LC", alpha3: "LCA", name: { fr: "Sainte-Lucie", en: "Saint Lucia" } },
    { alpha2: "LI", alpha3: "LIE", name: { fr: "Liechtenstein", en: "Liechtenstein" } },
    { alpha2: "LK", alpha3: "LKA", name: { fr: "Sri Lanka", en: "Sri Lanka" } },
    { alpha2: "LR", alpha3: "LBR", name: { fr: "Liberia", en: "Liberia" } },
    { alpha2: "LS", alpha3: "LSO", name: { fr: "Lesotho", en: "Lesotho" } },
    { alpha2: "LT", alpha3: "LTU", name: { fr: "Lituanie", en: "Lithuania" } },
    { alpha2: "LU", alpha3: "LUX", name: { fr: "Luxembourg", en: "Luxembourg" } },
    { alpha2: "LV", alpha3: "LVA", name: { fr: "Lettonie", en: "Latvia" } },
    { alpha2: "LY", alpha3: "LBY", name: { fr: "Libye", en: "Libya" } },
    { alpha2: "MA", alpha3: "MAR", name: { fr: "Maroc", en: "Morocco" } },
    { alpha2: "MC", alpha3: "MCO", name: { fr: "Monaco", en: "Monaco" } },
    { alpha2: "MD", alpha3: "MDA", name: { fr: "Moldavie", en: "Moldova" } },
    { alpha2: "ME", alpha3: "MNE", name: { fr: "Mont\xE9n\xE9gro", en: "Montenegro" } },
    { alpha2: "MF", alpha3: "MAF", name: { fr: "Saint-Martin", en: "Saint Martin" } },
    { alpha2: "MG", alpha3: "MDG", name: { fr: "Madagascar", en: "Madagascar" } },
    { alpha2: "MH", alpha3: "MHL", name: { fr: "\xCEles Marshall", en: "Marshall Islands" } },
    { alpha2: "MK", alpha3: "MKD", name: { fr: "Mac\xE9doine du Nord", en: "North Macedonia" } },
    { alpha2: "ML", alpha3: "MLI", name: { fr: "Mali", en: "Mali" } },
    { alpha2: "MM", alpha3: "MMR", name: { fr: "Myanmar", en: "Myanmar" } },
    { alpha2: "MN", alpha3: "MNG", name: { fr: "Mongolie", en: "Mongolia" } },
    { alpha2: "MO", alpha3: "MAC", name: { fr: "Macao", en: "Macao" } },
    { alpha2: "MP", alpha3: "MNP", name: { fr: "\xCEles Mariannes du Nord", en: "Northern Mariana Islands" } },
    { alpha2: "MQ", alpha3: "MTQ", name: { fr: "Martinique", en: "Martinique" } },
    { alpha2: "MR", alpha3: "MRT", name: { fr: "Mauritanie", en: "Mauritania" } },
    { alpha2: "MS", alpha3: "MSR", name: { fr: "Montserrat", en: "Montserrat" } },
    { alpha2: "MT", alpha3: "MLT", name: { fr: "Malte", en: "Malta" } },
    { alpha2: "MU", alpha3: "MUS", name: { fr: "Maurice", en: "Mauritius" } },
    { alpha2: "MV", alpha3: "MDV", name: { fr: "Maldives", en: "Maldives" } },
    { alpha2: "MW", alpha3: "MWI", name: { fr: "Malawi", en: "Malawi" } },
    { alpha2: "MX", alpha3: "MEX", name: { fr: "Mexique", en: "Mexico" } },
    { alpha2: "MY", alpha3: "MYS", name: { fr: "Malaisie", en: "Malaysia" } },
    { alpha2: "MZ", alpha3: "MOZ", name: { fr: "Mozambique", en: "Mozambique" } },
    { alpha2: "NA", alpha3: "NAM", name: { fr: "Namibie", en: "Namibia" } },
    { alpha2: "NC", alpha3: "NCL", name: { fr: "Nouvelle-Cal\xE9donie", en: "New Caledonia" } },
    { alpha2: "NE", alpha3: "NER", name: { fr: "Niger", en: "Niger" } },
    { alpha2: "NF", alpha3: "NFK", name: { fr: "\xCEle Norfolk", en: "Norfolk Island" } },
    { alpha2: "NG", alpha3: "NGA", name: { fr: "Nigeria", en: "Nigeria" } },
    { alpha2: "NI", alpha3: "NIC", name: { fr: "Nicaragua", en: "Nicaragua" } },
    { alpha2: "NL", alpha3: "NLD", name: { fr: "Pays-Bas", en: "Netherlands" } },
    { alpha2: "NO", alpha3: "NOR", name: { fr: "Norv\xE8ge", en: "Norway" } },
    { alpha2: "NP", alpha3: "NPL", name: { fr: "N\xE9pal", en: "Nepal" } },
    { alpha2: "NR", alpha3: "NRU", name: { fr: "Nauru", en: "Nauru" } },
    { alpha2: "NU", alpha3: "NIU", name: { fr: "Niue", en: "Niue" } },
    { alpha2: "NZ", alpha3: "NZL", name: { fr: "Nouvelle-Z\xE9lande", en: "New Zealand" } },
    { alpha2: "OM", alpha3: "OMN", name: { fr: "Oman", en: "Oman" } },
    { alpha2: "PA", alpha3: "PAN", name: { fr: "Panama", en: "Panama" } },
    { alpha2: "PE", alpha3: "PER", name: { fr: "P\xE9rou", en: "Peru" } },
    { alpha2: "PF", alpha3: "PYF", name: { fr: "Polyn\xE9sie fran\xE7aise", en: "French Polynesia" } },
    { alpha2: "PG", alpha3: "PNG", name: { fr: "Papouasie-Nouvelle-Guin\xE9e", en: "Papua New Guinea" } },
    { alpha2: "PH", alpha3: "PHL", name: { fr: "Philippines", en: "Philippines" } },
    { alpha2: "PK", alpha3: "PAK", name: { fr: "Pakistan", en: "Pakistan" } },
    { alpha2: "PL", alpha3: "POL", name: { fr: "Pologne", en: "Poland" } },
    { alpha2: "PM", alpha3: "SPM", name: { fr: "Saint-Pierre-et-Miquelon", en: "Saint Pierre and Miquelon" } },
    { alpha2: "PN", alpha3: "PCN", name: { fr: "Pitcairn", en: "Pitcairn" } },
    { alpha2: "PR", alpha3: "PRI", name: { fr: "Porto Rico", en: "Puerto Rico" } },
    { alpha2: "PS", alpha3: "PSE", name: { fr: "Palestine", en: "Palestine" } },
    { alpha2: "PT", alpha3: "PRT", name: { fr: "Portugal", en: "Portugal" } },
    { alpha2: "PW", alpha3: "PLW", name: { fr: "Palaos", en: "Palau" } },
    { alpha2: "PY", alpha3: "PRY", name: { fr: "Paraguay", en: "Paraguay" } },
    { alpha2: "QA", alpha3: "QAT", name: { fr: "Qatar", en: "Qatar" } },
    { alpha2: "RE", alpha3: "REU", name: { fr: "La R\xE9union", en: "R\xE9union" } },
    { alpha2: "RO", alpha3: "ROU", name: { fr: "Roumanie", en: "Romania" } },
    { alpha2: "RS", alpha3: "SRB", name: { fr: "Serbie", en: "Serbia" } },
    { alpha2: "RU", alpha3: "RUS", name: { fr: "Russie", en: "Russia" } },
    { alpha2: "RW", alpha3: "RWA", name: { fr: "Rwanda", en: "Rwanda" } },
    { alpha2: "SA", alpha3: "SAU", name: { fr: "Arabie saoudite", en: "Saudi Arabia" } },
    { alpha2: "SB", alpha3: "SLB", name: { fr: "\xCEles Salomon", en: "Solomon Islands" } },
    { alpha2: "SC", alpha3: "SYC", name: { fr: "Seychelles", en: "Seychelles" } },
    { alpha2: "SD", alpha3: "SDN", name: { fr: "Soudan", en: "Sudan" } },
    { alpha2: "SE", alpha3: "SWE", name: { fr: "Su\xE8de", en: "Sweden" } },
    { alpha2: "SG", alpha3: "SGP", name: { fr: "Singapour", en: "Singapore" } },
    { alpha2: "SH", alpha3: "SHN", name: { fr: "Sainte-H\xE9l\xE8ne", en: "Saint Helena" } },
    { alpha2: "SI", alpha3: "SVN", name: { fr: "Slov\xE9nie", en: "Slovenia" } },
    { alpha2: "SJ", alpha3: "SJM", name: { fr: "Svalbard et Jan Mayen", en: "Svalbard and Jan Mayen" } },
    { alpha2: "SK", alpha3: "SVK", name: { fr: "Slovaquie", en: "Slovakia" } },
    { alpha2: "SL", alpha3: "SLE", name: { fr: "Sierra Leone", en: "Sierra Leone" } },
    { alpha2: "SM", alpha3: "SMR", name: { fr: "Saint-Marin", en: "San Marino" } },
    { alpha2: "SN", alpha3: "SEN", name: { fr: "S\xE9n\xE9gal", en: "Senegal" } },
    { alpha2: "SO", alpha3: "SOM", name: { fr: "Somalie", en: "Somalia" } },
    { alpha2: "SR", alpha3: "SUR", name: { fr: "Suriname", en: "Suriname" } },
    { alpha2: "SS", alpha3: "SSD", name: { fr: "Soudan du Sud", en: "South Sudan" } },
    { alpha2: "ST", alpha3: "STP", name: { fr: "S\xE3o Tom\xE9-et-Pr\xEDncipe", en: "S\xE3o Tom\xE9 and Pr\xEDncipe" } },
    { alpha2: "SV", alpha3: "SLV", name: { fr: "Salvador", en: "El Salvador" } },
    { alpha2: "SX", alpha3: "SXM", name: { fr: "Saint-Martin", en: "Sint Maarten" } },
    { alpha2: "SY", alpha3: "SYR", name: { fr: "Syrie", en: "Syria" } },
    { alpha2: "SZ", alpha3: "SWZ", name: { fr: "Eswatini", en: "Eswatini" } },
    { alpha2: "TC", alpha3: "TCA", name: { fr: "\xCEles Turques-et-Ca\xEFques", en: "Turks and Caicos Islands" } },
    { alpha2: "TD", alpha3: "TCD", name: { fr: "Tchad", en: "Chad" } },
    { alpha2: "TF", alpha3: "ATF", name: { fr: "Terres australes fran\xE7aises", en: "French Southern Territories" } },
    { alpha2: "TG", alpha3: "TGO", name: { fr: "Togo", en: "Togo" } },
    { alpha2: "TH", alpha3: "THA", name: { fr: "Tha\xEFlande", en: "Thailand" } },
    { alpha2: "TJ", alpha3: "TJK", name: { fr: "Tadjikistan", en: "Tajikistan" } },
    { alpha2: "TK", alpha3: "TKL", name: { fr: "Tokelau", en: "Tokelau" } },
    { alpha2: "TL", alpha3: "TLS", name: { fr: "Timor oriental", en: "Timor-Leste" } },
    { alpha2: "TM", alpha3: "TKM", name: { fr: "Turkm\xE9nistan", en: "Turkmenistan" } },
    { alpha2: "TN", alpha3: "TUN", name: { fr: "Tunisie", en: "Tunisia" } },
    { alpha2: "TO", alpha3: "TON", name: { fr: "Tonga", en: "Tonga" } },
    { alpha2: "TR", alpha3: "TUR", name: { fr: "Turquie", en: "Turkey" } },
    { alpha2: "TT", alpha3: "TTO", name: { fr: "Trinit\xE9-et-Tobago", en: "Trinidad and Tobago" } },
    { alpha2: "TV", alpha3: "TUV", name: { fr: "Tuvalu", en: "Tuvalu" } },
    { alpha2: "TW", alpha3: "TWN", name: { fr: "Ta\xEFwan", en: "Taiwan" } },
    { alpha2: "TZ", alpha3: "TZA", name: { fr: "Tanzanie", en: "Tanzania" } },
    { alpha2: "UA", alpha3: "UKR", name: { fr: "Ukraine", en: "Ukraine" } },
    { alpha2: "UG", alpha3: "UGA", name: { fr: "Ouganda", en: "Uganda" } },
    { alpha2: "UM", alpha3: "UMI", name: { fr: "\xCEles mineures \xE9loign\xE9es des \xC9tats-Unis", en: "United States Minor Outlying Islands" } },
    { alpha2: "US", alpha3: "USA", name: { fr: "\xC9tats-Unis", en: "United States" } },
    { alpha2: "UY", alpha3: "URY", name: { fr: "Uruguay", en: "Uruguay" } },
    { alpha2: "UZ", alpha3: "UZB", name: { fr: "Ouzb\xE9kistan", en: "Uzbekistan" } },
    { alpha2: "VA", alpha3: "VAT", name: { fr: "Vatican", en: "Vatican City" } },
    { alpha2: "VC", alpha3: "VCT", name: { fr: "Saint-Vincent-et-les-Grenadines", en: "Saint Vincent and the Grenadines" } },
    { alpha2: "VE", alpha3: "VEN", name: { fr: "Venezuela", en: "Venezuela" } },
    { alpha2: "VG", alpha3: "VGB", name: { fr: "\xCEles Vierges britanniques", en: "British Virgin Islands" } },
    { alpha2: "VI", alpha3: "VIR", name: { fr: "\xCEles Vierges am\xE9ricaines", en: "United States Virgin Islands" } },
    { alpha2: "VN", alpha3: "VNM", name: { fr: "Vietnam", en: "Vietnam" } },
    { alpha2: "VU", alpha3: "VUT", name: { fr: "Vanuatu", en: "Vanuatu" } },
    { alpha2: "WF", alpha3: "WLF", name: { fr: "Wallis-et-Futuna", en: "Wallis and Futuna" } },
    { alpha2: "WS", alpha3: "WSM", name: { fr: "Samoa", en: "Samoa" } },
    { alpha2: "YE", alpha3: "YEM", name: { fr: "Y\xE9men", en: "Yemen" } },
    { alpha2: "YT", alpha3: "MYT", name: { fr: "Mayotte", en: "Mayotte" } },
    { alpha2: "ZA", alpha3: "ZAF", name: { fr: "Afrique du Sud", en: "South Africa" } },
    { alpha2: "ZM", alpha3: "ZMB", name: { fr: "Zambie", en: "Zambia" } },
    { alpha2: "ZW", alpha3: "ZWE", name: { fr: "Zimbabwe", en: "Zimbabwe" } }
  ];

  // src/modules/countrySelect.ui.js
  function captureStyles(element) {
    const selectComputedStyle = window.getComputedStyle(element);
    const selectWidth = element.offsetWidth || parseFloat(selectComputedStyle.width) || "auto";
    const selectHeight = element.offsetHeight || parseFloat(selectComputedStyle.height) || "auto";
    const selectMinWidth = selectComputedStyle.minWidth !== "none" ? selectComputedStyle.minWidth : null;
    const selectMaxWidth = selectComputedStyle.maxWidth !== "none" ? selectComputedStyle.maxWidth : null;
    const selectMinHeight = selectComputedStyle.minHeight !== "none" ? selectComputedStyle.minHeight : null;
    const selectMaxHeight = selectComputedStyle.maxHeight !== "none" ? selectComputedStyle.maxHeight : null;
    const selectBgColor = selectComputedStyle.backgroundColor;
    let selectBorder = selectComputedStyle.border;
    if (!selectBorder || selectBorder === "none" || selectBorder === "0px none rgb(0, 0, 0)") {
      if (selectComputedStyle.borderWidth && selectComputedStyle.borderStyle && selectComputedStyle.borderColor) {
        selectBorder = selectComputedStyle.borderWidth + " " + selectComputedStyle.borderStyle + " " + selectComputedStyle.borderColor;
      } else {
        selectBorder = null;
      }
    }
    const selectBorderColor = selectComputedStyle.borderColor;
    const selectBorderRadius = selectComputedStyle.borderRadius;
    const selectColor = selectComputedStyle.color;
    const selectFontSize = selectComputedStyle.fontSize;
    const selectFontFamily = selectComputedStyle.fontFamily;
    let selectPadding = selectComputedStyle.padding;
    if (!selectPadding || selectPadding === "0px") {
      if (selectComputedStyle.paddingTop && selectComputedStyle.paddingRight && selectComputedStyle.paddingBottom && selectComputedStyle.paddingLeft) {
        selectPadding = selectComputedStyle.paddingTop + " " + selectComputedStyle.paddingRight + " " + selectComputedStyle.paddingBottom + " " + selectComputedStyle.paddingLeft;
      } else {
        selectPadding = null;
      }
    }
    return {
      selectWidth,
      selectHeight,
      selectMinWidth,
      selectMaxWidth,
      selectMinHeight,
      selectMaxHeight,
      selectBgColor,
      selectBorder,
      selectBorderColor,
      selectBorderRadius,
      selectColor,
      selectFontSize,
      selectFontFamily,
      selectPadding
    };
  }
  function buildWrapper(element, styles) {
    const { selectWidth, selectHeight, selectMinWidth, selectMaxWidth, selectMinHeight, selectMaxHeight } = styles;
    const wrapper = document.createElement("div");
    wrapper.className = "bb-country-select-wrapper";
    let wrapperStyle = "position: relative;";
    if (selectWidth !== "auto" && selectWidth > 0) wrapperStyle += " width: " + selectWidth + "px;";
    if (selectHeight !== "auto" && selectHeight > 0) wrapperStyle += " min-height: " + selectHeight + "px;";
    if (selectMinWidth) wrapperStyle += " min-width: " + selectMinWidth + ";";
    if (selectMaxWidth) wrapperStyle += " max-width: " + selectMaxWidth + ";";
    if (selectMinHeight) wrapperStyle += " min-height: " + selectMinHeight + ";";
    if (selectMaxHeight) wrapperStyle += " max-height: " + selectMaxHeight + ";";
    wrapper.style.cssText = wrapperStyle;
    const selectStyle = element.style.cssText || "";
    element.style.cssText = selectStyle + "; position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; overflow: hidden;";
    element.setAttribute("aria-hidden", "true");
    return wrapper;
  }
  function buildTrigger(styles, cfg) {
    const {
      selectWidth,
      selectHeight,
      selectMinWidth,
      selectMaxWidth,
      selectMinHeight,
      selectMaxHeight,
      selectBgColor,
      selectBorder,
      selectBorderColor,
      selectBorderRadius,
      selectColor,
      selectFontSize,
      selectFontFamily,
      selectPadding
    } = styles;
    const { language, placeholder, defaultCountry } = cfg;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "bb-country-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const selectedCountry = defaultCountry;
    const selectedName = selectedCountry ? selectedCountry.name[language] : placeholder;
    const selectedFlag = selectedCountry && bbContents.utils.isValidCountryCode(selectedCountry.alpha2) ? '<img src="https://hatscripts.github.io/circle-flags/flags/' + selectedCountry.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(selectedCountry.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">' : "";
    trigger.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;"><span class="bb-country-flag" style="flex-shrink: 0;">' + selectedFlag + '</span><span class="bb-country-name" style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + bbContents.utils.sanitize(selectedName) + '</span></div><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink: 0; transition: transform 0.2s;"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    let triggerStyle = "display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-sizing: border-box; transition: border-color 0.2s;";
    if (selectBgColor && selectBgColor !== "rgba(0, 0, 0, 0)" && selectBgColor !== "transparent") triggerStyle += " background-color: " + selectBgColor + ";";
    if (selectBorder && selectBorder !== "none" && selectBorder !== "0px none rgb(0, 0, 0)") triggerStyle += " border: " + selectBorder + ";";
    else if (selectBorderColor && selectBorderColor !== "rgba(0, 0, 0, 0)") triggerStyle += " border-color: " + selectBorderColor + ";";
    if (selectBorderRadius && selectBorderRadius !== "0px") triggerStyle += " border-radius: " + selectBorderRadius + ";";
    if (selectColor && selectColor !== "rgba(0, 0, 0, 0)") triggerStyle += " color: " + selectColor + ";";
    if (selectFontSize) triggerStyle += " font-size: " + selectFontSize + ";";
    if (selectFontFamily) triggerStyle += " font-family: " + selectFontFamily + ";";
    if (selectPadding && selectPadding !== "0px") triggerStyle += " padding: " + selectPadding + ";";
    if (selectWidth !== "auto" && selectWidth > 0) triggerStyle += " width: " + selectWidth + "px;";
    else triggerStyle += " width: 100%;";
    if (selectHeight !== "auto" && selectHeight > 0) triggerStyle += " height: " + selectHeight + "px;";
    if (selectMinWidth) triggerStyle += " min-width: " + selectMinWidth + ";";
    if (selectMaxWidth) triggerStyle += " max-width: " + selectMaxWidth + ";";
    if (selectMinHeight) triggerStyle += " min-height: " + selectMinHeight + ";";
    if (selectMaxHeight) triggerStyle += " max-height: " + selectMaxHeight + ";";
    trigger.style.cssText = triggerStyle;
    return {
      trigger,
      flagSpan: trigger.querySelector(".bb-country-flag"),
      nameSpan: trigger.querySelector(".bb-country-name"),
      chevron: trigger.querySelector("svg")
    };
  }
  function buildPopover(styles, cfg) {
    const { selectBorderRadius, selectFontSize, selectFontFamily } = styles;
    const { searchPlaceholder } = cfg;
    const popover = document.createElement("div");
    popover.className = "bb-country-select-popover";
    popover.setAttribute("role", "listbox");
    let popoverStyle = "position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; max-height: 300px; overflow: hidden; display: none; z-index: 50; background-color: white; border: 1px solid #e5e7eb;";
    if (selectBorderRadius && selectBorderRadius !== "0px") popoverStyle += " border-radius: " + selectBorderRadius + ";";
    else popoverStyle += " border-radius: 6px;";
    popoverStyle += " box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);";
    popover.style.cssText = popoverStyle;
    const searchWrapper = document.createElement("div");
    searchWrapper.className = "bb-country-search";
    searchWrapper.style.cssText = "position: sticky; top: 0; padding: 8px; background-color: white; border-bottom: 1px solid #e5e7eb; z-index: 1;";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "bb-country-search-input";
    searchInput.placeholder = searchPlaceholder;
    searchInput.setAttribute("aria-label", searchPlaceholder);
    let searchInputStyle = "width: 100%; padding: 8px 12px; box-sizing: border-box;";
    if (selectFontSize) searchInputStyle += " font-size: " + selectFontSize + ";";
    if (selectFontFamily) searchInputStyle += " font-family: " + selectFontFamily + ";";
    searchInputStyle += " border: 1px solid #e5e7eb;";
    if (selectBorderRadius && selectBorderRadius !== "0px") {
      const borderRadiusValue = parseFloat(selectBorderRadius);
      if (!isNaN(borderRadiusValue)) searchInputStyle += " border-radius: " + borderRadiusValue * 0.75 + "px;";
    } else {
      searchInputStyle += " border-radius: 4px;";
    }
    searchInput.style.cssText = searchInputStyle;
    searchWrapper.appendChild(searchInput);
    popover.appendChild(searchWrapper);
    const list = document.createElement("div");
    list.className = "bb-country-list";
    list.style.cssText = "overflow-y: auto; max-height: 250px; padding-bottom: 8px;";
    popover.appendChild(list);
    return { popover, searchInput, list };
  }
  function buildUI(element, styles, cfg) {
    const wrapper = buildWrapper(element, styles);
    const t = buildTrigger(styles, cfg);
    const p = buildPopover(styles, cfg);
    return {
      wrapper,
      trigger: t.trigger,
      popover: p.popover,
      searchInput: p.searchInput,
      list: p.list,
      flagSpan: t.flagSpan,
      nameSpan: t.nameSpan,
      chevron: t.chevron
    };
  }

  // src/modules/countrySelect.render.js
  function renderCountries(ctx, countries) {
    const { list, language, styles } = ctx;
    const { selectFontSize, selectFontFamily } = styles;
    const currentSelectedCountry = ctx.currentSelectedCountry;
    if (countries.length === 0) {
      const noResult = bbContents.config.i18n.noCountryFound[language] || (language === "en" ? "No country found" : "Aucun pays trouv\xE9");
      list.innerHTML = '<div style="padding: 16px; text-align: center; color: #9ca3af; font-size: inherit; font-family: inherit;">' + bbContents.utils.sanitize(noResult) + "</div>";
      return;
    }
    list.innerHTML = countries.map(function(country) {
      if (!bbContents.utils.isValidCountryCode(country.alpha2)) return "";
      const isSelected = currentSelectedCountry && currentSelectedCountry.alpha2 === country.alpha2;
      let itemStyle = "display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; transition: background-color 0.15s; min-height: 36px; box-sizing: border-box;";
      if (selectFontSize) itemStyle += " font-size: " + bbContents.utils.escapeCss(selectFontSize) + ";";
      if (selectFontFamily) itemStyle += " font-family: " + bbContents.utils.escapeCss(selectFontFamily) + ";";
      if (isSelected) itemStyle += " background-color: #f3f4f6;";
      return '<div class="bb-country-item" data-country="' + country.alpha2.toLowerCase() + '" role="option" aria-selected="' + (isSelected ? "true" : "false") + '" style="' + itemStyle + '"><img src="https://hatscripts.github.io/circle-flags/flags/' + country.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(country.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"><span style="line-height: 1.2;">' + bbContents.utils.sanitize(country.name[language]) + "</span></div>";
    }).join("");
    list.querySelectorAll(".bb-country-item").forEach(function(item) {
      item.addEventListener("mouseenter", function() {
        if (this.getAttribute("aria-selected") !== "true") this.style.backgroundColor = "#f3f4f6";
      });
      item.addEventListener("mouseleave", function() {
        if (this.getAttribute("aria-selected") !== "true") this.style.backgroundColor = "";
      });
    });
  }
  function bindTrigger(ctx) {
    const { trigger, popover, chevron, searchInput, sortedCountries } = ctx;
    trigger.addEventListener("click", function(e) {
      e.stopPropagation();
      const isOpen = popover.style.display === "block";
      if (!isOpen) {
        document.querySelectorAll(".bb-country-select-popover").forEach(function(otherPopover) {
          if (otherPopover !== popover && otherPopover.style.display === "block") {
            otherPopover.style.display = "none";
            if (otherPopover.parentElement) {
              const otherTrigger = otherPopover.parentElement.querySelector(".bb-country-select-trigger");
              if (otherTrigger) {
                otherTrigger.setAttribute("aria-expanded", "false");
                const otherChevron = otherTrigger.querySelector("svg");
                if (otherChevron) otherChevron.style.transform = "rotate(0deg)";
              }
            }
          }
        });
      }
      popover.style.display = isOpen ? "none" : "block";
      trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
      if (chevron) chevron.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
      if (!isOpen) {
        searchInput.focus();
        searchInput.value = "";
        renderCountries(ctx, sortedCountries);
      }
    });
  }
  function bindOutsideClick(ctx) {
    const { wrapper, popover, trigger, chevron } = ctx;
    document.addEventListener("click", function(e) {
      if (!wrapper.contains(e.target)) {
        popover.style.display = "none";
        trigger.setAttribute("aria-expanded", "false");
        if (chevron) chevron.style.transform = "rotate(0deg)";
      }
    });
  }
  function bindSearch(ctx) {
    const { searchInput, popover, trigger, chevron, sortedCountries, language } = ctx;
    searchInput.addEventListener("input", function(e) {
      const query = e.target.value.toLowerCase();
      const filtered = sortedCountries.filter(function(c) {
        return c.name[language].toLowerCase().indexOf(query) !== -1 || c.alpha2.toLowerCase().indexOf(query) !== -1 || c.alpha3.toLowerCase().indexOf(query) !== -1;
      });
      renderCountries(ctx, filtered);
    });
    searchInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        popover.style.display = "none";
        trigger.setAttribute("aria-expanded", "false");
        if (chevron) chevron.style.transform = "rotate(0deg)";
        trigger.focus();
      }
    });
  }
  function bindList(ctx) {
    const { self, element, language, sortedCountries, popover, trigger, chevron, searchInput, list, flagSpan, nameSpan } = ctx;
    list.addEventListener("click", function(e) {
      const item = e.target.closest(".bb-country-item");
      if (!item) return;
      const countryCode = item.dataset.country;
      if (!bbContents.utils.isValidCountryCode(countryCode)) return;
      const country = self.countries.find(function(c) {
        return c.alpha2.toLowerCase() === countryCode.toLowerCase();
      });
      if (!country) return;
      ctx.currentSelectedCountry = country;
      if (bbContents.utils.isValidCountryCode(country.alpha2)) {
        flagSpan.innerHTML = '<img src="https://hatscripts.github.io/circle-flags/flags/' + country.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(country.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">';
        nameSpan.textContent = country.name[language];
      }
      const countryName = country.name[language];
      element.value = countryName;
      const existingOption = Array.from(element.options).find(function(opt) {
        return opt.value === countryName;
      });
      if (!existingOption) {
        const newOption = document.createElement("option");
        newOption.value = countryName;
        newOption.textContent = countryName;
        if (element.options.length > 0) {
          Array.from(element.options).forEach(function(opt) {
            if (!opt.value || opt.value === "") opt.remove();
          });
        }
        element.appendChild(newOption);
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
      popover.style.display = "none";
      trigger.setAttribute("aria-expanded", "false");
      if (chevron) chevron.style.transform = "rotate(0deg)";
      searchInput.value = "";
      renderCountries(ctx, sortedCountries);
      setTimeout(function() {
        renderCountries(ctx, sortedCountries);
      }, 0);
    });
  }
  function bindEvents(ctx) {
    bindTrigger(ctx);
    bindOutsideClick(ctx);
    bindSearch(ctx);
    bindList(ctx);
  }

  // src/modules/countrySelect.js
  var countrySelect_default = {
    countries: countrySelect_data_default,
    getLanguage(element) {
      let lang = element.getAttribute("lang");
      if (!lang && element.closest) {
        const langElement = element.closest("[lang]");
        if (langElement) lang = langElement.getAttribute("lang");
      }
      if (!lang) lang = document.documentElement.getAttribute("lang");
      if (!lang) lang = "fr";
      return lang && lang.startsWith("en") ? "en" : "fr";
    },
    findCountry(query) {
      if (!query) return null;
      const upperQuery = query.toUpperCase().trim();
      const lowerQuery = query.toLowerCase().trim();
      return this.countries.find(function(c) {
        return c.alpha2 === upperQuery || c.alpha3 === upperQuery || c.name.fr.toLowerCase() === lowerQuery || c.name.en.toLowerCase() === lowerQuery;
      });
    },
    init(root) {
      const scope = root || document;
      if (scope.closest && scope.closest("[data-bb-disable]")) return;
      const elements = scope.querySelectorAll(bbContents._attrSelector("country-select"));
      const self = this;
      elements.forEach(function(element) {
        if (element.hasAttribute("data-bb-country-select-processed")) return;
        if (element.tagName !== "SELECT") return;
        element.setAttribute("data-bb-country-select-processed", "1");
        self._enhance(element);
      });
      bbContents.utils.log("Module CountrySelect initialis\xE9:", elements.length, "\xE9l\xE9ments");
    },
    _enhance(element) {
      const self = this;
      const cfg = self._resolveConfig(element);
      self._applyDefaultOption(element, cfg.defaultCountry, cfg.language);
      const sortedCountries = self._sortCountries(cfg.preferredCountries, cfg.language);
      const styles = captureStyles(element);
      const ui = buildUI(element, styles, cfg);
      const ctx = {
        self,
        element,
        language: cfg.language,
        styles,
        sortedCountries,
        currentSelectedCountry: cfg.defaultCountry,
        wrapper: ui.wrapper,
        trigger: ui.trigger,
        popover: ui.popover,
        searchInput: ui.searchInput,
        list: ui.list,
        flagSpan: ui.flagSpan,
        nameSpan: ui.nameSpan,
        chevron: ui.chevron
      };
      renderCountries(ctx, sortedCountries);
      const parent = element.parentNode;
      parent.insertBefore(ui.wrapper, element);
      ui.wrapper.appendChild(element);
      ui.wrapper.appendChild(ui.trigger);
      ui.wrapper.appendChild(ui.popover);
      bindEvents(ctx);
      ui.wrapper.setAttribute("data-bb-country-select-processed", "true");
    },
    _resolveConfig(element) {
      const self = this;
      const language = self.getLanguage(element);
      const preferredAttr = bbContents._getAttr(element, "bb-country-select-preferred");
      const defaultAttr = bbContents._getAttr(element, "bb-country-select-default");
      const placeholder = bbContents.config.i18n.selectCountry[language] || (language === "en" ? "Select country" : "S\xE9lectionner un pays");
      const searchPlaceholder = bbContents.config.i18n.searchCountry[language] || (language === "en" ? "Search country..." : "Rechercher un pays...");
      let preferredCountries = [];
      if (preferredAttr) {
        preferredAttr.split(",").forEach(function(code) {
          const country = self.findCountry(code.trim());
          if (country) preferredCountries.push(country.alpha2);
        });
      }
      let defaultCountry = null;
      if (defaultAttr) {
        defaultCountry = self.findCountry(defaultAttr.trim());
      } else if (element.value) {
        defaultCountry = self.findCountry(element.value);
      }
      return { language, placeholder, searchPlaceholder, preferredCountries, defaultCountry };
    },
    _applyDefaultOption(element, defaultCountry, language) {
      if (!defaultCountry) return;
      const countryName = defaultCountry.name[language];
      const existingOption = Array.from(element.options).find(function(opt) {
        return opt.value === countryName;
      });
      if (!existingOption) {
        const newOption = document.createElement("option");
        newOption.value = countryName;
        newOption.textContent = countryName;
        element.appendChild(newOption);
      }
      element.value = countryName;
    },
    _sortCountries(preferredCountries, language) {
      const self = this;
      const compare = function(a, b) {
        return a.name[language].localeCompare(b.name[language], language === "fr" ? "fr" : "en", {
          sensitivity: "base",
          ignorePunctuation: true,
          numeric: true
        });
      };
      let sortedCountries = self.countries.slice();
      if (preferredCountries.length > 0) {
        const preferred = preferredCountries.map(function(code) {
          return self.countries.find(function(c) {
            return c.alpha2 === code;
          });
        }).filter(function(c) {
          return c !== void 0;
        });
        const others = sortedCountries.filter(function(c) {
          return preferredCountries.indexOf(c.alpha2) === -1;
        }).sort(compare);
        return preferred.concat(others);
      }
      return sortedCountries.sort(compare);
    }
  };

  // src/modules/favicon.js
  var favicon_default = {
    originalFavicon: null,
    init(scope) {
      if (scope.closest && scope.closest("[data-bb-disable]")) return;
      const elements = scope.querySelectorAll(
        bbContents._attrSelector("favicon") + ", " + bbContents._attrSelector("favicon-dark")
      );
      if (elements.length === 0) return;
      const existingLink = document.querySelector("link[rel*='icon']");
      if (existingLink && !this.originalFavicon) {
        this.originalFavicon = existingLink.href;
      }
      let faviconUrl = null;
      let darkUrl = null;
      elements.forEach((element) => {
        if (element.hasAttribute("data-bb-favicon-processed")) return;
        element.setAttribute("data-bb-favicon-processed", "1");
        const light = bbContents._getAttr(element, "bb-favicon");
        const dark = bbContents._getAttr(element, "bb-favicon-dark");
        if (light) faviconUrl = light;
        if (dark) darkUrl = dark;
      });
      if (!faviconUrl && !darkUrl) return;
      if (faviconUrl && darkUrl) {
        this.setupDarkMode(faviconUrl, darkUrl);
      } else if (faviconUrl) {
        this.setFavicon(faviconUrl);
        bbContents.utils.log("Favicon chang\xE9:", faviconUrl);
      }
    },
    getFaviconElement() {
      let favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      return favicon;
    },
    setFavicon(url) {
      if (!url) return;
      const favicon = this.getFaviconElement();
      favicon.href = url + "?v=" + Date.now();
    },
    setupDarkMode(lightUrl, darkUrl) {
      const updateFavicon = (e) => {
        const darkModeOn = e ? e.matches : window.matchMedia("(prefers-color-scheme: dark)").matches;
        this.setFavicon(darkModeOn ? darkUrl : lightUrl);
      };
      updateFavicon(null);
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", updateFavicon);
      } else if (typeof mq.addListener === "function") {
        mq.addListener(updateFavicon);
      }
    }
  };

  // src/modules/youtube.js
  var youtube_default = {
    _activeRequests: /* @__PURE__ */ new Set(),
    isBot() {
      const userAgent = navigator.userAgent.toLowerCase();
      const botPatterns = [
        "bot",
        "crawler",
        "spider",
        "scraper",
        "googlebot",
        "bingbot",
        "slurp",
        "duckduckbot",
        "baiduspider",
        "yandexbot",
        "facebookexternalhit",
        "twitterbot",
        "linkedinbot",
        "whatsapp",
        "telegrambot",
        "discordbot",
        "slackbot",
        "headless",
        "phantom",
        "selenium",
        "puppeteer",
        "playwright",
        "lighthouse",
        "gtmetrix",
        "pagespeed",
        "pingdom",
        "uptime",
        "monitor",
        "check",
        "test"
      ];
      const isBot = botPatterns.some((pattern) => userAgent.includes(pattern)) || navigator.webdriver || !navigator.userAgent || navigator.userAgent.includes("HeadlessChrome");
      if (isBot && bbContents.config.debug) {
        bbContents.utils.log("Bot d\xE9tect\xE9, pas d'appel API YouTube");
      }
      return isBot;
    },
    cache: {
      get(key) {
        try {
          const cached = localStorage.getItem(key);
          if (!cached) return null;
          const data = JSON.parse(cached);
          if (Date.now() - data.timestamp > 24 * 60 * 60 * 1e3) {
            localStorage.removeItem(key);
            return null;
          }
          return data.value;
        } catch (e) {
          return null;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
        } catch (e) {
          console.error("[bb-contents] youtube cache set failed:", e);
        }
      }
    },
    isRequestActive(cacheKey) {
      return this._activeRequests.has(cacheKey);
    },
    markRequestActive(cacheKey) {
      this._activeRequests.add(cacheKey);
    },
    markRequestComplete(cacheKey) {
      this._activeRequests.delete(cacheKey);
    },
    init(root) {
      const scope = root || document;
      if (scope.closest && scope.closest("[data-bb-disable]")) return;
      if (this.isBot()) return;
      this.cleanCache();
      const allElements = scope.querySelectorAll(bbContents._attrSelector("youtube-channel"));
      if (allElements.length === 0) return;
      const elementsByConfig = {};
      allElements.forEach((element) => {
        if (element.hasAttribute("data-bb-youtube-processed")) return;
        const channelIdsRaw = bbContents._getAttr(element, "bb-youtube-channel");
        if (!channelIdsRaw) return;
        const channelIds = channelIdsRaw.split(",").map((id) => id.trim()).filter((id) => id);
        if (channelIds.length === 0) return;
        const normalizedChannelIds = channelIds.sort().join(",");
        const allowShorts = bbContents._getAttr(element, "bb-youtube-allow-shorts") === "true";
        const language = bbContents._getAttr(element, "bb-youtube-language") || "fr";
        const videoCount = parseInt(bbContents._getAttr(element, "bb-youtube-video-count") || "10", 10);
        const skip = parseInt(bbContents._getAttr(element, "bb-youtube-skip") || "0", 10);
        const configKey = `${normalizedChannelIds}_${allowShorts}_${language}`;
        if (!elementsByConfig[configKey]) {
          elementsByConfig[configKey] = {
            elements: [],
            maxVideoCount: 0,
            maxSkip: 0,
            channelIds: normalizedChannelIds,
            allowShorts,
            language
          };
        }
        elementsByConfig[configKey].maxVideoCount = Math.max(elementsByConfig[configKey].maxVideoCount, videoCount);
        elementsByConfig[configKey].maxSkip = Math.max(elementsByConfig[configKey].maxSkip, skip);
        element.setAttribute("data-bb-youtube-processed", "true");
        elementsByConfig[configKey].elements.push(element);
      });
      Object.keys(elementsByConfig).forEach((configKey) => {
        const group = elementsByConfig[configKey];
        group.elements.forEach((element) => {
          const videoCount = parseInt(bbContents._getAttr(element, "bb-youtube-video-count") || "10", 10);
          const skip = parseInt(bbContents._getAttr(element, "bb-youtube-skip") || "0", 10);
          this.initElement(element, group, videoCount, skip);
        });
      });
    },
    initElement(element, groupConfig, videoCount, skip) {
      if (this.isBot()) return;
      if (!groupConfig) {
        const channelIdsRaw = bbContents._getAttr(element, "bb-youtube-channel");
        if (!channelIdsRaw) return;
        const channelIds2 = channelIdsRaw.split(",").map((id) => id.trim()).filter((id) => id);
        if (channelIds2.length === 0) return;
        const normalizedChannelIds = channelIds2.sort().join(",");
        const allowShorts = bbContents._getAttr(element, "bb-youtube-allow-shorts") === "true";
        const language = bbContents._getAttr(element, "bb-youtube-language") || "fr";
        groupConfig = {
          channelIds: normalizedChannelIds,
          allowShorts,
          language,
          maxVideoCount: parseInt(bbContents._getAttr(element, "bb-youtube-video-count") || "10", 10),
          maxSkip: parseInt(bbContents._getAttr(element, "bb-youtube-skip") || "0", 10)
        };
        videoCount = groupConfig.maxVideoCount;
        skip = groupConfig.maxSkip;
      }
      if (!videoCount) videoCount = parseInt(bbContents._getAttr(element, "bb-youtube-video-count") || "10", 10);
      if (skip === void 0 || skip === null) skip = parseInt(bbContents._getAttr(element, "bb-youtube-skip") || "0", 10);
      const endpoint = bbContents.checkYouTubeConfig() ? bbContents.config.youtubeEndpoint : null;
      if (!endpoint) {
        const retries = parseInt(element.getAttribute("data-youtube-retry-count") || "0", 10);
        if (retries < 10) {
          element.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Configuration YouTube en cours...</div>';
          element.setAttribute("data-youtube-retry-count", (retries + 1).toString());
          setTimeout(() => this.initElement(element), 500);
        } else {
          element.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Configuration YouTube manquante</strong><br>Ajoutez dans le &lt;head&gt; :<br><code style="display: block; background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace;">&lt;script&gt;<br>bbContents.config.youtubeEndpoint = 'votre-worker-url';<br>&lt;/script&gt;</code></div>`;
        }
        return;
      }
      let template = element.querySelector(bbContents._attrSelector("youtube-item"));
      let container = element;
      if (!template) {
        const containerElement = element.querySelector(bbContents._attrSelector("youtube-container"));
        if (containerElement) {
          container = containerElement;
          template = containerElement.querySelector(bbContents._attrSelector("youtube-item"));
        }
      }
      if (!template) {
        element.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Template manquant</strong><br>Ajoutez un \xE9l\xE9ment avec l'attribut bb-youtube-item</div>`;
        return;
      }
      template.style.display = "none";
      element.setAttribute("data-bb-youtube-processed", "true");
      const baseCacheKey = `youtube_${groupConfig.channelIds}_${groupConfig.allowShorts}_${groupConfig.language}`;
      const cachedData = this.cache.get(baseCacheKey);
      const minItemsNeeded = skip + videoCount;
      if (cachedData && cachedData.items && cachedData.items.length >= minItemsNeeded) {
        const limitedData = this.applySkipAndLimit(cachedData, skip, videoCount);
        this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
        return;
      }
      if (cachedData && cachedData.items && cachedData.items.length < minItemsNeeded) {
        try {
          localStorage.removeItem(baseCacheKey);
        } catch (e) {
          console.error("[bb-contents] youtube cache remove failed:", e);
        }
      }
      if (this.isRequestActive(baseCacheKey)) {
        let activeAttempts = 0;
        const checkActive = () => {
          if (activeAttempts >= 100) {
            container.innerHTML = this._errorBox("D\xE9lai d\xE9pass\xE9");
            return;
          }
          if (!this.isRequestActive(baseCacheKey)) {
            const newCachedData = this.cache.get(baseCacheKey);
            if (newCachedData && newCachedData.items && newCachedData.items.length >= minItemsNeeded) {
              const limitedData = this.applySkipAndLimit(newCachedData, skip, videoCount);
              this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
            } else if (newCachedData && newCachedData.items && newCachedData.items.length < minItemsNeeded) {
              try {
                localStorage.removeItem(baseCacheKey);
              } catch (e) {
                console.error("[bb-contents] youtube cache remove failed:", e);
              }
              this.initElement(element, groupConfig, videoCount, skip);
            } else {
              container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Erreur de chargement</div>';
            }
          } else {
            activeAttempts++;
            setTimeout(checkActive, 200);
          }
        };
        checkActive();
        return;
      }
      this.markRequestActive(baseCacheKey);
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Chargement des vid\xE9os YouTube...</div>';
      const apiVideoCount = groupConfig.maxVideoCount + groupConfig.maxSkip;
      const endpointInvalid = !endpoint || typeof endpoint !== "string" || !endpoint.startsWith("http://") && !endpoint.startsWith("https://") || bbContents.config.youtubeEndpoint && !endpoint.startsWith(bbContents.config.youtubeEndpoint);
      if (endpointInvalid) {
        this.markRequestComplete(baseCacheKey);
        container.innerHTML = this._errorBox("Endpoint YouTube invalide");
        return;
      }
      const channelIds = groupConfig.channelIds.split(",");
      const invalidChannelId = channelIds.find((id) => !id || !/^[a-zA-Z0-9_-]+$/.test(id));
      if (invalidChannelId !== void 0) {
        this.markRequestComplete(baseCacheKey);
        container.innerHTML = this._errorBox("Channel ID invalide : " + invalidChannelId);
        return;
      }
      const safeAllowShorts = groupConfig.allowShorts === true || groupConfig.allowShorts === "true";
      if (channelIds.length > 1) {
        this.fetchMultipleChannels(endpoint, channelIds, apiVideoCount, safeAllowShorts).then((data) => {
          if (data.error) throw new Error(data.error.message || "Erreur API YouTube");
          this.cache.set(baseCacheKey, data);
          const limitedData = this.applySkipAndLimit(data, skip, videoCount);
          this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
          this.markRequestComplete(baseCacheKey);
        }).catch((error) => {
          this.markRequestComplete(baseCacheKey);
          this.handleFetchError(error, container, baseCacheKey, skip, videoCount, template, groupConfig);
        });
      } else {
        fetch(`${endpoint}?channelId=${encodeURIComponent(channelIds[0])}&maxResults=${apiVideoCount}&allowShorts=${safeAllowShorts}`).then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        }).then((data) => {
          if (data.error) throw new Error(data.error.message || "Erreur API YouTube");
          this.cache.set(baseCacheKey, data);
          const limitedData = this.applySkipAndLimit(data, skip, videoCount);
          this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
          this.markRequestComplete(baseCacheKey);
        }).catch((error) => {
          this.markRequestComplete(baseCacheKey);
          this.handleFetchError(error, container, baseCacheKey, skip, videoCount, template, groupConfig);
        });
      }
    },
    _errorBox(message) {
      return '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>' + bbContents.utils.sanitize(message || "Erreur inconnue") + "</div>";
    },
    applySkipAndLimit(data, skip, videoCount) {
      if (!data || !data.items) return data;
      const afterSkip = skip > 0 ? data.items.slice(skip) : data.items;
      return __spreadProps(__spreadValues({}, data), { items: afterSkip.slice(0, videoCount) });
    },
    fetchMultipleChannels(endpoint, channelIds, maxResults, allowShorts) {
      if (channelIds.length > 10) throw new Error("Maximum 10 channelIds allowed");
      const promises = channelIds.map((channelId) => {
        return fetch(`${endpoint}?channelId=${encodeURIComponent(channelId)}&maxResults=${maxResults}&allowShorts=${allowShorts}`).then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status} for channel ${channelId}`);
          return response.json();
        }).then((data) => {
          if (data.error) throw new Error(data.error.message || "Erreur API YouTube");
          return { success: true, items: data.items || [] };
        }).catch(() => ({ success: false, items: [] }));
      });
      return Promise.all(promises).then((allResults) => {
        const allChannelsFailed = allResults.every((result) => !result.success);
        const mergedItems = [].concat(...allResults.map((result) => result.items));
        mergedItems.sort((a, b) => {
          var _a, _b;
          const dateA = new Date(((_a = a.snippet) == null ? void 0 : _a.publishedAt) || 0);
          const dateB = new Date(((_b = b.snippet) == null ? void 0 : _b.publishedAt) || 0);
          return dateB - dateA;
        });
        return {
          items: mergedItems,
          pageInfo: { totalResults: mergedItems.length, resultsPerPage: mergedItems.length },
          allChannelsFailed
        };
      });
    },
    handleFetchError(error, container, cacheKey, skip, videoCount, template, groupConfig) {
      const expiredCache = localStorage.getItem(cacheKey);
      if (expiredCache) {
        try {
          const cachedData = JSON.parse(expiredCache);
          const limitedData = this.applySkipAndLimit(cachedData.value, skip, videoCount);
          this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
          return;
        } catch (e) {
          console.error("[bb-contents] youtube expired cache parse failed:", e);
        }
      }
      container.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>${bbContents.utils.sanitize(error.message || "Erreur inconnue")}</div>`;
    },
    generateYouTubeFeed(container, template, data, allowShorts, language = "fr") {
      if (!data || !data.items || data.items.length === 0) {
        if (data && data.allChannelsFailed) {
          container.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; text-align: center;"><strong>Erreur de chargement</strong><br>Impossible de r\xE9cup\xE9rer les vid\xE9os des cha\xEEnes YouTube</div>';
        } else {
          container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Aucune vid\xE9o trouv\xE9e</div>';
        }
        return;
      }
      const marqueeElements = container.querySelectorAll("[data-bb-marquee-processed]");
      container.innerHTML = "";
      marqueeElements.forEach((marqueeEl) => container.appendChild(marqueeEl));
      data.items.forEach((item) => {
        var _a;
        const videoId = (_a = item.id) == null ? void 0 : _a.videoId;
        if (!videoId) return;
        const snippet = item.snippet;
        const clone = template.cloneNode(true);
        clone.style.display = "";
        this.fillVideoData(clone, videoId, snippet, language);
        container.appendChild(clone);
      });
    },
    fillVideoData(element, videoId, snippet, language = "fr") {
      if (element.tagName === "A" || element.hasAttribute("bb-youtube-item") || element.hasAttribute("data-bb-youtube-item")) {
        element.href = `https://www.youtube.com/watch?v=${videoId}`;
        element.target = "_blank";
        element.rel = "noopener noreferrer";
      }
      const thumbnail = element.querySelector(bbContents._attrSelector("youtube-thumbnail"));
      if (thumbnail) {
        const t = snippet.thumbnails;
        const bestUrl = (t.maxres || t.high || t.medium || t.default || {}).url;
        if (bestUrl && bbContents.utils.isValidUrl(bestUrl)) {
          thumbnail.src = bestUrl;
          thumbnail.alt = snippet.title;
        }
      }
      const title = element.querySelector(bbContents._attrSelector("youtube-title"));
      if (title) title.textContent = this.decodeHtmlEntities(snippet.title);
      const description = element.querySelector(bbContents._attrSelector("youtube-description"));
      if (description) description.textContent = this.decodeHtmlEntities(snippet.description);
      const date = element.querySelector(bbContents._attrSelector("youtube-date"));
      if (date) date.textContent = this.formatDate(snippet.publishedAt, language);
      const channel = element.querySelector(bbContents._attrSelector("youtube-channel"));
      if (channel) channel.textContent = snippet.channelTitle;
    },
    formatDate(dateString, language = "fr") {
      const date = new Date(dateString);
      const diffDays = Math.ceil(Math.abs(/* @__PURE__ */ new Date() - date) / (1e3 * 60 * 60 * 24));
      const t = {
        fr: { day: "jour", days: "jours", week: "semaine", weeks: "semaines", month: "mois", months: "mois", year: "an", years: "ans", ago: "Il y a" },
        en: { day: "day", days: "days", week: "week", weeks: "weeks", month: "month", months: "months", year: "year", years: "years", ago: "ago" }
      }[language] || { day: "jour", days: "jours", week: "semaine", weeks: "semaines", month: "mois", months: "mois", year: "an", years: "ans", ago: "Il y a" };
      if (diffDays === 1) return `${t.ago} 1 ${t.day}`;
      if (diffDays < 7) return `${t.ago} ${diffDays} ${t.days}`;
      const weeks = Math.floor(diffDays / 7);
      if (weeks === 1) return `${t.ago} 1 ${t.week}`;
      if (diffDays < 30) return `${t.ago} ${weeks} ${t.weeks}`;
      const months = Math.floor(diffDays / 30);
      if (months === 1) return `${t.ago} 1 ${t.month}`;
      if (diffDays < 365) return `${t.ago} ${months} ${t.months}`;
      const years = Math.floor(diffDays / 365);
      if (years === 1) return `${t.ago} 1 ${t.year}`;
      return `${t.ago} ${years} ${t.years}`;
    },
    decodeHtmlEntities(text) {
      if (!text) return "";
      const div = document.createElement("div");
      div.textContent = text;
      const textarea = document.createElement("textarea");
      textarea.innerHTML = div.innerHTML;
      return textarea.value;
    },
    cleanCache() {
      try {
        const now = Date.now();
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("youtube_")) {
            try {
              const cached = JSON.parse(localStorage.getItem(key));
              if (now - cached.timestamp > 24 * 60 * 60 * 1e3) localStorage.removeItem(key);
            } catch (e) {
              localStorage.removeItem(key);
            }
          }
        });
      } catch (e) {
        console.error("[bb-contents] youtube cleanCache failed:", e);
      }
    }
  };

  // src/internal/utils.js
  var utils_default = {
    log(...args) {
      if (bbContents.config.debug) {
        console.log("[BB Contents]", ...args);
      }
    },
    // Escapes for safe insertion into HTML, in both text-node AND
    // attribute (value="...") contexts. A plain textContent->innerHTML
    // round-trip does NOT escape " or ', allowing attribute-context breakout.
    sanitize(str) {
      if (typeof str !== "string") return "";
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },
    isValidCountryCode(code) {
      if (!code || typeof code !== "string") return false;
      return /^[a-z]{2}$/i.test(code.trim());
    },
    escapeCss(value) {
      if (!value || typeof value !== "string") return "";
      return value.replace(/[<>"']/g, (match) => ({
        "<": "\\3C ",
        ">": "\\3E ",
        '"': "\\22 ",
        "'": "\\27 "
      })[match] || match);
    },
    cleanHtml(html) {
      if (!html || typeof html !== "string") return "";
      let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
      cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
      cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");
      return cleaned;
    },
    // Accepts only absolute http(s) URLs. Rejects javascript:, data:, etc.
    isValidUrl(string) {
      try {
        const protocol = new URL(string).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch (_) {
        return false;
      }
    }
  };

  // src/internal/option-rules.js
  var option_rules_default = [
    { option: "marquee-speed", root: "marquee" },
    { option: "marquee-direction", root: "marquee" },
    { option: "marquee-pause", root: "marquee" },
    { option: "marquee-gap", root: "marquee" },
    { option: "marquee-orientation", root: "marquee" },
    { option: "marquee-height", root: "marquee" },
    { option: "marquee-min-height", root: "marquee" },
    { option: "url", root: "share" },
    { option: "text", root: "share" },
    { option: "current-year-format", root: "current-year" },
    { option: "current-year-prefix", root: "current-year" },
    { option: "current-year-suffix", root: "current-year" },
    { option: "reading-time-target", root: "reading-time" },
    { option: "reading-time-speed", root: "reading-time" },
    { option: "reading-time-image-speed", root: "reading-time" },
    { option: "reading-time-format", root: "reading-time" },
    { option: "reading-time-url", root: "reading-time" },
    { option: "country-select-preferred", root: "country-select" },
    { option: "country-select-default", root: "country-select" },
    { option: "favicon-dark", root: "favicon" },
    { option: "youtube-video-count", root: "youtube-channel" },
    { option: "youtube-skip", root: "youtube-channel" },
    { option: "youtube-language", root: "youtube-channel" },
    { option: "youtube-allow-shorts", root: "youtube-channel" }
  ];

  // src/core.js
  var BB_CONTENTS_VERSION = "1.1.22-test.1";
  var _schedule = typeof window !== "undefined" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (cb) => setTimeout(cb, 16);
  if (typeof window !== "undefined") {
    if (!window._bbContentsConfig) window._bbContentsConfig = {};
    if (window.bbContents || window._bbContentsVersionDisplayed || window._bbContentsInitialized) {
      window._bbContentsSkipInit = true;
    }
    window._bbContentsVersionDisplayed = true;
    window._bbContentsInitialized = true;
  }
  if (typeof window === "undefined" || !window._bbContentsSkipInit) {
    console.log("bb-contents | v" + BB_CONTENTS_VERSION);
  }
  var config = {
    version: BB_CONTENTS_VERSION,
    debug: false,
    prefix: "bb-",
    youtubeEndpoint: null,
    i18n: {
      copied: "Lien copi\xE9 !",
      selectCountry: { fr: "S\xE9lectionner un pays", en: "Select country" },
      searchCountry: { fr: "Rechercher un pays...", en: "Search country..." },
      noCountryFound: { fr: "Aucun pays trouv\xE9", en: "No country found" }
    }
  };
  if (typeof window !== "undefined") {
    if (window._bbContentsConfig && window._bbContentsConfig.youtubeEndpoint) {
      config.youtubeEndpoint = window._bbContentsConfig.youtubeEndpoint;
    }
  }
  var bbContents2 = {
    config,
    modules: { marquee: marquee_default, share: share_default, currentYear: currentYear_default, readingTime: readingTime_default, countrySelect: countrySelect_default, favicon: favicon_default, youtube: youtube_default },
    // Attribute → module name mapping. Single source of truth.
    attrMap: {
      "marquee": "marquee",
      "share": "share",
      "current-year": "currentYear",
      "reading-time": "readingTime",
      "country-select": "countrySelect",
      "favicon": "favicon",
      "youtube-channel": "youtube"
    },
    // Internal attribute suffixes that must never trigger module init
    _internalSuffixes: ["processed", "initialized"],
    // Option → root rules for dev-mode validation
    _optionRules: option_rules_default,
    // Cached compound CSS selector (compiled once in init)
    _scanSelector: null,
    // Observer state
    _observer: null,
    _reinitScheduled: false,
    _pending: null,
    // Map<moduleName, Set<Element>>
    // ─── Utilities ────────────────────────────────────────────────────────────
    utils: utils_default,
    // ─── Helpers ──────────────────────────────────────────────────────────────
    // Accepts both 'marquee' and 'bb-marquee'
    _attrSelector(name) {
      const bare = name.replace(/^bb-/, "");
      return `[bb-${bare}], [data-bb-${bare}]`;
    },
    _getAttr(element, name) {
      const bare = name.replace(/^bb-/, "");
      return element.getAttribute(`bb-${bare}`) || element.getAttribute(`data-bb-${bare}`);
    },
    // ─── Module detection ─────────────────────────────────────────────────────
    _buildScanSelector() {
      return Object.keys(this.attrMap).flatMap((key) => [
        `[bb-${key}]`,
        `[data-bb-${key}]`
      ]).join(",");
    },
    _resolveModule(attrName) {
      const name = attrName.replace(/^data-/, "").replace(/^bb-/, "");
      if (this._internalSuffixes.some((s) => name.endsWith("-" + s))) return null;
      if (this.attrMap[name]) return this.attrMap[name];
      const parts = name.split("-");
      for (let len = parts.length - 1; len > 0; len--) {
        const candidate = parts.slice(0, len).join("-");
        if (this.attrMap[candidate]) return this.attrMap[candidate];
      }
      return null;
    },
    _detectPresentModules(scope) {
      const found = /* @__PURE__ */ new Set();
      const collect = (el) => {
        for (const attr of el.attributes) {
          const mod = this._resolveModule(attr.name);
          if (mod) found.add(mod);
        }
      };
      if (scope.matches && scope.matches(this._scanSelector)) collect(scope);
      scope.querySelectorAll(this._scanSelector).forEach(collect);
      return found;
    },
    // ─── Debug guard ──────────────────────────────────────────────────────────
    _checkOptionRules(scope) {
      if (!this.config.debug) return;
      this._optionRules.forEach(({ option, root }) => {
        scope.querySelectorAll(`[bb-${option}], [data-bb-${option}]`).forEach((el) => {
          if (!el.hasAttribute(`bb-${root}`) && !el.hasAttribute(`data-bb-${root}`)) {
            console.warn(`[bb-contents] bb-${option} found without bb-${root} on`, el);
          }
        });
      });
    },
    // ─── Init ─────────────────────────────────────────────────────────────────
    init() {
      this.utils.log("Initialisation v" + this.config.version);
      if (!this._scanSelector) {
        this._scanSelector = this._buildScanSelector();
      }
      const scope = document.querySelector("[data-bb-scope]") || document;
      const needed = this._detectPresentModules(scope);
      needed.forEach((name) => {
        const mod = this.modules[name];
        if (!mod) return;
        try {
          mod.init(scope);
        } catch (e) {
          console.error("[bb-contents]", name, "init failed:", e);
        }
      });
      this._checkOptionRules(scope);
      this.setupObserver();
    },
    reinit() {
      this.init();
    },
    checkYouTubeConfig() {
      if (this.config.youtubeEndpoint) return true;
      if (window._bbContentsConfig && window._bbContentsConfig.youtubeEndpoint) {
        this.config.youtubeEndpoint = window._bbContentsConfig.youtubeEndpoint;
        return true;
      }
      return false;
    },
    // ─── Observer ─────────────────────────────────────────────────────────────
    setupObserver() {
      if (this._observer) {
        this._observer.disconnect();
      }
      this._pending = /* @__PURE__ */ new Map();
      this._observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            const process = (el) => {
              for (const attr of el.attributes) {
                const mod = this._resolveModule(attr.name);
                if (!mod) continue;
                if (!this._pending.has(mod)) this._pending.set(mod, /* @__PURE__ */ new Set());
                this._pending.get(mod).add(node);
              }
            };
            if (node.matches && node.matches(this._scanSelector)) process(node);
            node.querySelectorAll(this._scanSelector).forEach(process);
          });
        });
        if (this._pending.size && !this._reinitScheduled) {
          this._reinitScheduled = true;
          _schedule(() => {
            const toFlush = this._pending;
            this._pending = /* @__PURE__ */ new Map();
            this._reinitScheduled = false;
            toFlush.forEach((roots, name) => {
              roots.forEach((root) => {
                try {
                  this.modules[name].init(root);
                } catch (e) {
                  console.error("[bb-contents]", name, e);
                }
              });
            });
            this._checkOptionRules(document.querySelector("[data-bb-scope]") || document);
          });
        }
      });
      this._observer.observe(document.body, { childList: true, subtree: true });
      this.utils.log("MutationObserver actif");
    }
  };
  if (typeof window !== "undefined" && !window._bbContentsSkipInit) {
    window.bbContents = bbContents2;
    window.configureYouTube = function(endpoint) {
      if (!endpoint || typeof endpoint !== "string") {
        console.error("bb-contents: Endpoint YouTube invalide");
        return;
      }
      if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
        console.error("bb-contents: Endpoint YouTube doit \xEAtre une URL valide (http:// ou https://)");
        return;
      }
      bbContents2.config.youtubeEndpoint = endpoint;
      bbContents2.reinit();
    };
  }
  function initBBContents() {
    if (typeof window !== "undefined" && window._bbContentsSkipInit) return;
    const delay = typeof document !== "undefined" && document.body && document.body.hasAttribute("bb-performance-boost") ? 300 : 100;
    if (typeof document !== "undefined" && document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(() => bbContents2.init(), delay));
    } else {
      setTimeout(() => bbContents2.init(), delay);
    }
  }
  initBBContents();
  var core_default = bbContents2;
})();
